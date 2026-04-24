/**
 * Tour video configuration mapping page/feature keywords to video resources.
 * Each video is a short walkthrough (20-50 seconds) showing how specific pages work.
 */

export type TourVideo = {
  id: string;
  page: string;
  title: string;
  description: string;
  url: string;
  keywords: string[];
  duration: string;
};

export const TOUR_VIDEOS: TourVideo[] = [
  {
    id: "dashboard-tour",
    page: "dashboard",
    title: "Dashboard Tour",
    description: "Learn how to use the Dashboard: pick Focus Atmospheres, select music, run the timer, and track your productivity.",
    url: "/tours/dashboard_page_video.mp4",
    keywords: ["dashboard", "focus", "timer", "music", "productivity", "stats", "checklist", "atmosphere", "background"],
    duration: "30s",
  },
  {
    id: "tasks-tour",
    page: "tasks",
    title: "Tasks Page Tour",
    description: "Discover how to manage your tasks using Pending and Completed tabs, filters, sorts, and mark tasks complete.",
    url: "/tours/tasks.mp4",
    keywords: ["tasks", "pending", "completed", "filter", "sort", "mark complete", "assignments", "exams", "projects"],
    duration: "25s",
  },
  {
    id: "courses-tour",
    page: "courses",
    title: "Courses Page Tour",
    description: "Explore the Courses page: upload syllabi, search courses, filter by type, and sort by name or time.",
    url: "/tours/courses.mp4",
    keywords: ["courses", "syllabus", "syllabi", "search", "filter", "lab", "online", "in-person", "sort"],
    duration: "30s",
  },
  {
    id: "schedule-tour",
    page: "schedule",
    title: "Schedule Generation Tour",
    description: "See how to use the Schedule page: Day, Week, Month, and Year views, subscribe for live updates, export, and move blocks.",
    url: "/tours/schedule-generation.mp4",
    keywords: ["schedule", "day view", "week view", "month view", "year view", "subscribe", "export", "live", "blocks", "generation"],
    duration: "45s",
  },
  {
    id: "canvas-extension-tour",
    page: "canvas-extension",
    title: "Canvas Extension Tour",
    description: "Learn how to use the Canvas Extension to sync your Canvas assignments and manage them directly from 11Planner.",
    url: "/tours/canvas-extension.mp4",
    keywords: ["canvas", "extension", "canvas extension", "sync", "assignments", "integrate", "chrome", "browser"],
    duration: "30s",
  },
];

/**
 * Find relevant tour videos based on user message and current pathname.
 * Returns videos that match keywords in the message or are relevant to the current page.
 */
export function findRelevantTourVideos(
  message: string,
  pathname: string | null
): TourVideo[] {
  const normalizedMessage = message.toLowerCase();
  const normalizedPathname = (pathname || "").toLowerCase();

  // Keywords that indicate user wants a video/tour
  const videoRequestKeywords = [
    "show",
    "video",
    "tour",
    "how",
    "walkthrough",
    "demo",
    "explain",
    "feature",
    "tutorial",
    "see",
    "watch",
    "guide",
  ];

  const isVideoRequest = videoRequestKeywords.some((keyword) =>
    normalizedMessage.includes(keyword)
  );

  if (!isVideoRequest) return [];

  // Find videos matching the message keywords
  const matchedVideos = TOUR_VIDEOS.filter((video) =>
    video.keywords.some((keyword) => normalizedMessage.includes(keyword.toLowerCase()))
  );

  // If no exact keyword match, check if we're on a specific page and the user wants to learn about it
  if (matchedVideos.length === 0) {
    const pageVideo = TOUR_VIDEOS.find((video) =>
      normalizedPathname.includes(video.page)
    );
    if (pageVideo) {
      matchedVideos.push(pageVideo);
    }
  }

  return matchedVideos;
}

/**
 * Get a tour video by its ID.
 */
export function getTourVideoById(id: string): TourVideo | undefined {
  return TOUR_VIDEOS.find((video) => video.id === id);
}

/**
 * Get all tour videos for a specific page.
 */
export function getTourVideosForPage(page: string): TourVideo[] {
  return TOUR_VIDEOS.filter(
    (video) => video.page.toLowerCase() === page.toLowerCase()
  );
}
