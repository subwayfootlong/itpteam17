import CommentModerationPanel from "@/components/admin/CommentModerationPanel";
import { getModerationComments } from "@/lib/commentModeration";
import DiscussionGroupAudienceManager from "@/components/admin/DiscussionGroupAudienceManager";

export const dynamic = "force-dynamic";

export default async function CommentModerationPage() {
  const comments = await getModerationComments();

  return (
    <div className="space-y-6">
      <DiscussionGroupAudienceManager />
      <CommentModerationPanel initialComments={comments} />
    </div>
  );
}
