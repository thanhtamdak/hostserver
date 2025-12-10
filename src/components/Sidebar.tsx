// src/components/Sidebar.tsx - Right/left sidebar for chat/people/activities
const Sidebar = ({ children }) => {
  return <div className="w-80 bg-gray-800 p-4 overflow-y-auto">{children}</div>;
};

export default Sidebar;
