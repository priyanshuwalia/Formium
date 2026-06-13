import Logo from "./Logo";

const MadeWithFormium = () => {
  return (
    <div className="p-2 flex gap-1 z-10 fixed right-3 bottom-3 border border-gray-300">
      <Logo size={20} /> Made with Formium
    </div>
  );
};

export default MadeWithFormium;
