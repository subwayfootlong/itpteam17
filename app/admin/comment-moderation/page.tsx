import CommentModerationPanel from "@/components/admin/CommentModerationPanel";
import { getModerationComments } from "@/lib/commentModeration";

export const dynamic = "force-dynamic";

export default async function CommentModerationPage() {
  const comments = await getModerationComments();

  return <CommentModerationPanel initialComments={comments} />;
}
