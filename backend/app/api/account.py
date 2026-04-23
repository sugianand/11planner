# Account management API routes — handles account deletion and Supabase client setup.

import os

from fastapi import APIRouter, HTTPException
from supabase import Client, create_client

# Router for account-related endpoints
router = APIRouter(prefix="/api", tags=["account"])

# Singleton Supabase client instance (lazily initialized)
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return a cached Supabase client, creating one on first call.

    Checks multiple environment variable names so the same helper works
    in both local dev and deployed environments.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    # Support multiple env-var names for flexibility across environments
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


@router.delete("/account/{user_id}")
async def delete_account(user_id: str):
    """Permanently delete a user account and all associated data.

    Removes rows in dependency order (children first) to avoid
    foreign-key constraint violations, then deletes the auth user.
    """
    supabase = get_supabase()

    try:
        # Delete child records before parent records to respect FK constraints
        supabase.table("schedule_blocks").delete().eq("user_id", user_id).execute()
        supabase.table("tasks").delete().eq("user_id", user_id).execute()
        supabase.table("assignments").delete().eq("user_id", user_id).execute()
        supabase.table("courses").delete().eq("user_id", user_id).execute()
        supabase.table("profiles").delete().eq("id", user_id).execute()

        # Finally remove the authentication record itself
        supabase.auth.admin.delete_user(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"detail": "Account deleted successfully."}
