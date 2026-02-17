import BranchListPage from "@/components/shop-manager/BranchListPage";

interface BranchesPageProps {
    params: Promise<{ shopId: string }>;
}

export default async function BranchesPage({ params }: BranchesPageProps) {
    const { shopId } = await params;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-16 lg:h-32" />
            <main className="container mx-auto px-4 py-4 md:py-12">
                <BranchListPage shopId={shopId} />
            </main>
            <div className="py-12" />
        </div>
    );
}
