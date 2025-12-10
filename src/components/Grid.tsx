// src/components/Grid.tsx - Participant grid view
interface GridProps {
  streams: { [userId: string]: MediaStream };
  viewMode: 'grid' | 'speaker' | 'pinned' | 'sidebar';
}

const Grid = ({ streams, viewMode }: GridProps) => {
  // Implement dynamic grid layout based on participant count
  // Highlight active speaker with border
  // Use video elements for each stream
  return (
    <div className="grid grid-cols-4 gap-2 p-4"> {/* Adjust cols dynamically */}
      {Object.entries(streams).map(([userId, stream]) => (
        <div key={userId} className="relative">
          <video autoPlay playsInline srcObject={stream} className="w-full h-full object-cover rounded" />
          <div className="absolute bottom-2 left-2 bg-gray-800 px-2 py-1 rounded text-sm">User {userId}</div>
        </div>
      ))}
    </div>
  );
};

export default Grid;
