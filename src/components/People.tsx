// src/components/People.tsx - Participant list
const People = ({ socket, roomId }) => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Listen for participant updates
  }, []);

  return (
    <div>
      <h3>Participants</h3>
      {participants.map((p) => <div key={p.id}>{p.name} {p.isHost ? '(Host)' : ''}</div>)}
    </div>
  );
};

export default People;
