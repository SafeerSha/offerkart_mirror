import AddBranchForm from "@/components/shop-manager/AddBranchForm";

export const dynamic = "force-dynamic";

interface AddBranchPageProps {
    params: Promise<{ shopId: string }>;
}

export default async function AddBranchPage({ params }: AddBranchPageProps) {
    const { shopId } = await params;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-28 lg:h-32" />
            <main className="container mx-auto px-4 py-4 md:py-12">
                <AddBranchForm shopId={shopId} />
            </main>
            <div className="py-12" />
        </div>
    );
}
