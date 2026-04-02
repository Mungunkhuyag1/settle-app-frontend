import { GroupDetailClient } from "@/components/settle/group-detail-client";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({
  params,
}: GroupDetailPageProps) {
  const { groupId } = await params;

  return <GroupDetailClient groupId={groupId} />;
}
