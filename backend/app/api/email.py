import asyncio
import html
import json
import os
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

router = APIRouter(prefix="/api", tags=["email"])

_supabase_client: Client | None = None


class SendEmailRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    html_body: str | None = None
    reply_to: str | None = None


# Lazily initializes and returns a shared Supabase client.
def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )

    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase credentials are missing. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)."
            ),
        )

    _supabase_client = create_client(url, key)
    return _supabase_client


# Creates a stable ISO week key used to avoid duplicate weekly emails.
def iso_week_key(now: datetime) -> str:
    calendar = now.isocalendar()
    return f"{calendar.year}-W{calendar.week:02d}"


# Builds weekly report task stats using current task state from Supabase.
def build_weekly_report_stats(user_id: str, now: datetime) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("tasks")
        .select("task_title, deadline_at, status")
        .eq("user_id", user_id)
        .order("deadline_at", desc=False)
        .execute()
    )

    rows = result.data or []
    week_ahead = now + timedelta(days=7)

    def parse_deadline(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            normalized = value.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            return None

    completed = 0
    pending = 0
    overdue = 0
    upcoming: list[tuple[str, datetime]] = []

    for row in rows:
        status = (row.get("status") or "").lower()
        deadline = parse_deadline(row.get("deadline_at"))

        if status == "completed":
            completed += 1
            continue

        pending += 1
        if not deadline:
            continue
        if deadline < now:
            overdue += 1
        elif deadline <= week_ahead:
            upcoming.append((row.get("task_title") or "Untitled task", deadline))

    upcoming.sort(key=lambda pair: pair[1])
    top_upcoming = upcoming[:5]

    return {
        "total": len(rows),
        "completed": completed,
        "pending": pending,
        "overdue": overdue,
        "upcoming": top_upcoming,
    }


# Renders plain text + HTML weekly report content with a friendly professional tone.
def build_weekly_report_content(user_id: str, now: datetime, user_name: str | None) -> tuple[str, str, str]:
    stats = build_weekly_report_stats(user_id, now)
    greeting_name = (user_name or "there").strip() or "there"
    motivation_line = (
        "Great momentum this week. Keep stacking small wins and your progress will compound."
        if stats["completed"] > 0
        else "A new week is a fresh start. One focused study block today can build momentum quickly."
    )

    def format_deadline(value: datetime) -> str:
        return value.astimezone().strftime("%a, %b %d at %I:%M %p")

    upcoming_lines = [
        f"- {title} ({format_deadline(deadline)})" for title, deadline in stats["upcoming"]
    ] or ["- No upcoming deadlines in the next 7 days."]

    plain_text = "\n".join([
        f"Hello {greeting_name},",
        "",
        "Here is your 11Planner weekly progress report:",
        "",
        f"Total tasks: {stats['total']}",
        f"Completed: {stats['completed']}",
        f"Remaining: {stats['pending']}",
        f"Overdue: {stats['overdue']}",
        f"Due in the next 7 days: {len(stats['upcoming'])}",
        "",
        motivation_line,
        "",
        "Upcoming tasks:",
        *upcoming_lines,
        "",
        "Open 11Planner to review your Notifications page and adjust your schedule.",
        "",
        "Best regards,",
        "The 11Planner Team",
        "",
        "This is an automated no-reply message. Please do not reply to this email.",
    ])

    escaped_name = html.escape(greeting_name)
    escaped_motivation = html.escape(motivation_line)
    escaped_items = "".join(
        f"<li style=\"margin:0 0 8px;padding:0 0 8px;border-bottom:1px solid #e2e8f0;\">{html.escape(title)} <span style=\"display:block;font-size:12px;color:#64748b;margin-top:3px;\">{html.escape(format_deadline(deadline))}</span></li>"
        for title, deadline in stats["upcoming"]
    ) or "<li style=\"margin:0;padding:8px 0;\">No upcoming deadlines in the next 7 days.</li>"

    # Use table-based layout for better Gmail compatibility
    html_body = (
        "<div style='font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:20px;'>"
        "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;'>"
        "<tr><td style='padding:0;'>"
        "<div style='padding:18px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#f8fafc;'>"
        "<h1 style='margin:0;font-size:20px;'>Your 11Planner Weekly Report</h1>"
        "<p style='margin:8px 0 0;font-size:13px;color:#cbd5e1;'>A snapshot of your progress to keep you motivated.</p>"
        "</div>"
        "</td></tr>"
        "<tr><td style='padding:22px 24px;color:#0f172a;line-height:1.6;'>"
        f"<p style='margin:0 0 16px;font-size:14px;'>Hello {escaped_name},</p>"
        "<p style='margin:0 0 20px;font-size:14px;'>Here is a quick look at your week in 11Planner:</p>"
        "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:0 0 20px;'>"
        "<tr>"
        f"<td style='width:48%;padding-right:10px;'><div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;'><div style='font-size:11px;color:#64748b;margin-bottom:8px;font-weight:500;'>TASKS COMPLETED</div><div style='font-size:28px;font-weight:700;color:#16a34a;'>{stats['completed']}</div></div></td>"
        f"<td style='width:48%;padding-left:10px;'><div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;'><div style='font-size:11px;color:#64748b;margin-bottom:8px;font-weight:500;'>REMAINING TASKS</div><div style='font-size:28px;font-weight:700;color:#0f172a;'>{stats['pending']}</div></div></td>"
        "</tr>"
        "<tr><td colspan='2' style='height:10px;'></td></tr>"
        "<tr>"
        f"<td style='width:48%;padding-right:10px;'><div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;'><div style='font-size:11px;color:#64748b;margin-bottom:8px;font-weight:500;'>OVERDUE TASKS</div><div style='font-size:28px;font-weight:700;color:#dc2626;'>{stats['overdue']}</div></div></td>"
        f"<td style='width:48%;padding-left:10px;'><div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;'><div style='font-size:11px;color:#64748b;margin-bottom:8px;font-weight:500;'>DUE IN 7 DAYS</div><div style='font-size:28px;font-weight:700;color:#2563eb;'>{len(stats['upcoming'])}</div></div></td>"
        "</tr>"
        "</table>"
        f"<p style='margin:0 0 18px;color:#334155;font-size:14px;line-height:1.6;'>{escaped_motivation}</p>"
        "<h2 style='margin:0 0 12px;font-size:15px;color:#0f172a;font-weight:600;'>Upcoming tasks</h2>"
        f"<ul style='margin:0 0 20px;padding:0;color:#0f172a;list-style:none;'>{escaped_items}</ul>"
        "<p style='margin:0 0 16px;font-size:14px;'><strong>Ready to stay on track?</strong> Open 11Planner to review your notifications and fine-tune your schedule for next week.</p>"
        "<p style='margin:0;font-size:14px;'>Best regards,<br/><strong>The 11Planner Team</strong></p>"
        "</td></tr>"
        "<tr><td style='padding:12px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;line-height:1.5;'>"
        "This is an automated no-reply message. Please do not reply to this email."
        "</td></tr>"
        "</table>"
        "</div>"
    )

    subject = "Your 11Planner Weekly Progress Report"
    return subject, plain_text, html_body


# Builds HTML task alert email with professional styling.
def build_task_alert_email(user_name: str | None, alert_type: str, task_title: str, task_message: str) -> tuple[str, str, str]:
    """
    Builds a styled HTML task alert email.
    
    Args:
        user_name: Optional user's display name
        alert_type: Either "overdue" or "soon"
        task_title: The name of the task
        task_message: Additional details about the task
    
    Returns:
        Tuple of (subject, plain_text, html_body)
    """
    greeting_name = (user_name or "there").strip() or "there"
    is_overdue = alert_type.lower() == "overdue"
    alert_subject = "Task Overdue" if is_overdue else "Deadline Soon"
    alert_summary = "One of your tasks has passed its deadline." if is_overdue else "A task deadline is approaching soon."
    guidance = (
        "Please review the task as soon as possible and adjust your schedule if needed."
        if is_overdue
        else "Please review the task and plan your next study block before the deadline."
    )
    alert_color = "#dc2626" if is_overdue else "#f59e0b"
    alert_badge = "OVERDUE" if is_overdue else "DUE SOON"

    plain_text = "\n".join([
        f"Hello {greeting_name},",
        "",
        f"We wanted to let you know about an important update from your 11Planner notifications.",
        alert_summary,
        "",
        f"Alert: {alert_subject}",
        f"Task: {task_title}",
        f"Details: {task_message}",
        "",
        guidance,
        "Open 11Planner to review your notifications and keep your plan on track.",
        "",
        "Best regards,",
        "The 11Planner Team",
        "",
        "This is an automated no-reply message. Please do not reply to this email.",
    ])

    escaped_name = html.escape(greeting_name)
    escaped_title = html.escape(task_title)
    escaped_message = html.escape(task_message)
    escaped_summary = html.escape(alert_summary)
    escaped_guidance = html.escape(guidance)

    html_body = (
        "<div style='font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:20px;'>"
        "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;'>"
        "<tr><td style='padding:0;'>"
        "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='background:linear-gradient(135deg,#0f172a,#1e293b);'>"
        "<tr>"
        f"<td style='width:8px;background-color:{alert_color};padding:18px 0;'></td>"
        f"<td style='padding:18px 24px;color:#f8fafc;'>"
        f"<h1 style='margin:0;font-size:18px;font-weight:700;'>Task Alert: {alert_badge}</h1>"
        "<p style='margin:4px 0 0;font-size:12px;color:#cbd5e1;'>Action needed on your task</p>"
        "</td>"
        "</tr>"
        "</table>"
        "</td></tr>"
        "<tr><td style='padding:24px;color:#0f172a;line-height:1.6;'>"
        f"<p style='margin:0 0 16px;font-size:14px;'>Hello {escaped_name},</p>"
        f"<p style='margin:0 0 18px;font-size:14px;color:#334155;'>{escaped_summary}</p>"
        "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:0 0 20px;border-radius:4px;'>"
        f"<div style='font-size:13px;color:#78350f;margin:0;'>"
        f"<strong style='display:block;margin-bottom:6px;'>📌 {escaped_title}</strong>"
        f"{escaped_message}"
        "</div>"
        "</div>"
        f"<p style='margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;'>{escaped_guidance}</p>"
        "<div style='background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin:0 0 18px;text-align:center;'>"
        "<p style='margin:0;font-size:13px;'><strong>Ready to tackle this task?</strong><br/>Open 11Planner now to review your schedule and stay on top of your work.</p>"
        "</div>"
        "<p style='margin:0;font-size:14px;'>Best regards,<br/><strong>The 11Planner Team</strong></p>"
        "</td></tr>"
        "<tr><td style='padding:12px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;line-height:1.5;'>"
        "This is an automated no-reply message. Please do not reply to this email."
        "</td></tr>"
        "</table>"
        "</div>"
    )

    subject = f"[11Planner] {alert_subject}: {task_title}"
    return subject, plain_text, html_body


# Sends weekly report emails when it is weekend and not already sent for the current ISO week.
def send_due_weekly_reports() -> int:
    now = datetime.now(timezone.utc)
    if now.weekday() not in {5, 6}:
        return 0

    week_key = iso_week_key(now)
    supabase = get_supabase()
    
    result = supabase.table("user_settings").select("user_id, last_weekly_report_week").eq("weekly_report_enabled", True).execute()
    users = result.data or []
    
    sent_count = 0

    for user_data in users:
        user_id = user_data.get("user_id")
        if not user_id:
            continue
            
        if user_data.get("last_weekly_report_week") == week_key:
            continue

        try:
            auth_response = supabase.auth.admin.get_user_by_id(user_id)
            recipient = auth_response.user.email
            if not recipient:
                continue
                
            profile_res = supabase.table("profiles").select("firstname, lastname").eq("id", user_id).maybe_single().execute()
            user_name = None
            if profile_res.data:
                first = (profile_res.data.get("firstname") or "").strip()
                last = (profile_res.data.get("lastname") or "").strip()
                user_name = f"{first} {last}".strip() or None

            subject, text_body, html_body = build_weekly_report_content(user_id, now, user_name)
            send_smtp_email(recipient, subject, text_body, html_body=html_body)

            supabase.table("user_settings").update({
                "last_weekly_report_week": week_key,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user_id).execute()
            
            sent_count += 1
        except Exception as e:
            print(f"[weekly-email-worker] Failed to send to {user_id}: {e}")

    return sent_count


# Runs continuously to dispatch due weekly report emails on weekends.
async def weekly_email_worker() -> None:
    while True:
        try:
            await asyncio.to_thread(send_due_weekly_reports)
        except Exception as exc:
            print(f"[weekly-email-worker] {exc}")
        await asyncio.sleep(60 * 60)


# In-memory set to prevent duplicate task alert emails within a server session.
# Key: (user_id, task_id, alert_type) — cleared only on server restart.
_sent_task_alerts: set[tuple[str, str, str]] = set()


def parse_iso_datetime(value: str | None) -> datetime | None:
    """Parses an ISO 8601 datetime string to a UTC-aware datetime."""
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def send_due_task_alerts() -> int:
    """
    Checks all opted-in users for tasks that are overdue or within their
    reminder window and sends email alerts for any not yet sent this session.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    sent_count = 0

    # Fetch all users with email_updates_enabled, along with their reminder window.
    settings_res = supabase.table("user_settings").select(
        "user_id, reminder_lead_hours"
    ).eq("email_updates_enabled", True).execute()

    for user_settings in (settings_res.data or []):
        user_id = user_settings.get("user_id")
        if not user_id:
            continue

        lead_hours = user_settings.get("reminder_lead_hours") or 24
        window_end = now + timedelta(hours=lead_hours)

        try:
            # Fetch incomplete tasks for this user.
            tasks_res = supabase.table("tasks").select(
                "id, task_title, deadline_at, status"
            ).eq("user_id", user_id).neq("status", "completed").execute()

            tasks = tasks_res.data or []
            if not tasks:
                continue

            # Look up user email and name once per user.
            auth_response = supabase.auth.admin.get_user_by_id(user_id)
            recipient = auth_response.user.email
            if not recipient:
                continue

            profile_res = supabase.table("profiles").select("firstname, lastname").eq("id", user_id).maybe_single().execute()
            user_name = None
            if profile_res.data:
                first = (profile_res.data.get("firstname") or "").strip()
                last = (profile_res.data.get("lastname") or "").strip()
                user_name = f"{first} {last}".strip() or None

            for task in tasks:
                task_id = str(task.get("id") or "")
                task_title = task.get("task_title") or "Untitled task"
                deadline = parse_iso_datetime(task.get("deadline_at"))

                if not deadline:
                    continue

                # Determine alert type.
                if deadline < now:
                    alert_type = "overdue"
                    task_message = f"This task was due on {deadline.astimezone().strftime('%a, %b %d at %I:%M %p')} and has not been completed."
                elif deadline <= window_end:
                    alert_type = "soon"
                    task_message = f"This task is due on {deadline.astimezone().strftime('%a, %b %d at %I:%M %p')}."
                else:
                    continue  # Not yet in the reminder window.

                key = (user_id, task_id, alert_type)
                if key in _sent_task_alerts:
                    continue  # Already notified this session.

                subject, text_body, html_body = build_task_alert_email(user_name, alert_type, task_title, task_message)
                send_smtp_email(recipient, subject, text_body, html_body=html_body)
                _sent_task_alerts.add(key)
                sent_count += 1
                print(f"[task-alert-worker] Sent '{alert_type}' alert to {recipient} for task '{task_title}'")

        except Exception as e:
            print(f"[task-alert-worker] Failed for user {user_id}: {e}")

    return sent_count


# Runs continuously every 15 minutes to dispatch task alert emails.
async def task_alert_worker() -> None:
    while True:
        try:
            await asyncio.to_thread(send_due_task_alerts)
        except Exception as exc:
            print(f"[task-alert-worker] {exc}")
        await asyncio.sleep(15 * 60)  # Check every 15 minutes.



# Reads an SMTP boolean flag with a safe default for local development.
def read_smtp_flag(name: str, fallback: bool = True) -> bool:
    value = os.getenv(name)
    if value is None:
        return fallback
    return value.lower() not in {"0", "false", "no", "off"}


# Sends email using SMTP credentials from environment variables, with optional HTML content.
def send_smtp_email(
    recipient_email: str,
    subject: str,
    body: str,
    reply_to: str | None = None,
    html_body: str | None = None,
) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_user
    use_ssl = read_smtp_flag("SMTP_USE_SSL", False)
    use_tls = read_smtp_flag("SMTP_USE_TLS", True)

    if not smtp_host or not smtp_from:
        raise HTTPException(
            status_code=500,
            detail=(
                "SMTP configuration is missing. Set SMTP_HOST and SMTP_FROM, and "
                "provide SMTP_USER/SMTP_PASSWORD when authentication is required."
            ),
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = recipient_email
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as smtp:
            if smtp_user and smtp_password:
                smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
        return

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
        if use_tls:
            smtp.starttls()
        if smtp_user and smtp_password:
            smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)


# Performs a lightweight email sanity check before attempting delivery.
def validate_email_address(value: str, field_name: str) -> str:
    email = value.strip()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=422, detail=f"{field_name} must be a valid email address.")
    return email


@router.post("/email/send")
# Sends a direct email payload through the SMTP helper endpoint.
async def send_email(payload: SendEmailRequest):
    recipient = validate_email_address(payload.recipient_email, "recipient_email")
    reply_to = validate_email_address(payload.reply_to, "reply_to") if payload.reply_to else None

    try:
        send_smtp_email(recipient, payload.subject, payload.body, reply_to, payload.html_body)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}") from exc

    return {"detail": "Email sent successfully."}


@router.post("/email/weekly/send-due")
# Triggers weekend weekly-report sends immediately for all due users.
async def trigger_due_weekly_reports():
    sent = send_due_weekly_reports()
    return {"detail": f"Sent {sent} weekly report email(s)."}


@router.post("/email/task-alerts/send-due")
# Manually triggers the task alert worker — useful for testing without waiting 15 min.
async def trigger_due_task_alerts():
    sent = await asyncio.to_thread(send_due_task_alerts)
    return {"detail": f"Sent {sent} task alert email(s)."}



@router.post("/email/weekly/send-now/{user_id}")
# Sends a one-time weekly report email for the specified user.
async def send_weekly_report_now(user_id: str):
    supabase = get_supabase()
    
    try:
        auth_response = supabase.auth.admin.get_user_by_id(user_id)
        recipient = auth_response.user.email
    except Exception as exc:
        raise HTTPException(status_code=404, detail="User not found in auth.") from exc

    if not recipient:
        raise HTTPException(status_code=400, detail="User does not have an email address.")

    profile_res = supabase.table("profiles").select("firstname, lastname").eq("id", user_id).maybe_single().execute()
    user_name = None
    if profile_res.data:
        first = (profile_res.data.get("firstname") or "").strip()
        last = (profile_res.data.get("lastname") or "").strip()
        user_name = f"{first} {last}".strip() or None

    now = datetime.now(timezone.utc)
    subject, text_body, html_body = build_weekly_report_content(user_id, now, user_name)

    try:
        send_smtp_email(recipient, subject, text_body, html_body=html_body)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send weekly report: {exc}") from exc

    return {"detail": "Weekly report email sent."}


class TaskAlertEmailRequest(BaseModel):
    recipient_email: str
    user_name: str | None = None
    alert_type: str  # "overdue" or "soon"
    task_title: str
    task_message: str


@router.post("/email/task-alert/send")
# Sends a styled task alert email for overdue or due-soon events.
async def send_task_alert_email(payload: TaskAlertEmailRequest):
    recipient = validate_email_address(payload.recipient_email, "recipient_email")
    
    subject, text_body, html_body = build_task_alert_email(
        payload.user_name,
        payload.alert_type,
        payload.task_title,
        payload.task_message
    )

    try:
        send_smtp_email(recipient, subject, text_body, html_body=html_body)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send task alert: {exc}") from exc

    return {"detail": "Task alert email sent."}