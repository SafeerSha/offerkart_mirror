import BranchListPage from "@/components/shop-manager/BranchListPage";

export const dynamic = "force-dynamic";

interface BranchesPageProps {
    params: Promise<{ shopId: string }>;
}

export default async function BranchesPage({ params }: BranchesPageProps) {
    const { shopId } = await params;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-20 lg:h-24" />

            <main className="container mx-auto px-4 py-4 md:py-12">
                <BranchListPage shopId={shopId} />
            </main>
            <div className="py-12" />
        </div>
    );
}
