import { CottonBatchManager } from "@/components/cotton-batch-manager"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Калькулятор партий хлопка</h1>
      <CottonBatchManager />
    </main>
  )
}
