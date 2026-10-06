export default function DiscussionThreadLoading() {
  return (
    <div className="reddit-thread-page" aria-busy="true" aria-label="Loading discussion">
      <div className="reddit-thread-skeleton is-short" />
      <div className="reddit-thread-skeleton is-post" />
      <div className="reddit-thread-skeleton is-composer" />
      <div className="reddit-thread-skeleton is-comment" />
    </div>
  );
}
