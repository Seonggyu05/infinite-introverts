export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🌍 World Reset In Progress</h1>
        <p className="text-gray-700 mb-6">
          The canvas is being reset. All previous content has been cleared, and a fresh world is
          being prepared.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This page will automatically refresh when the reset is complete.
        </p>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  )
}
