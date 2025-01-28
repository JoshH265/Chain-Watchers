'use client'

export default function Home() {
  return (
    <section className='min-h-screen flex flex-col justify-center py-24 bg-gray-700 text-white'>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Chain Watchers</h1>
          <h2 className="text-2xl font-bold">Crypto Wallet Tracking & Analytics</h2>
        </div>
      </div>
      <div className="flex items-center justify-center mt-8">
        <div className="text-center">
          <p className="text-lg">Track your crypto wallets and analyze your transactions with ease.</p>
          <button 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
            onClick={() => window.location.href = '/wallet-search'}
          >
            Get Started
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center mt-16">
        <div className="text-center">
          <h3 className="text-xl font-bold">Features</h3>
          <ul className="list-disc list-inside mt-4">
            <li>Wallet Storage, Naming, & Tags</li>
            <li>Time based Profit & Loss Breakdown</li>
            <li>Detailed Trade History</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
