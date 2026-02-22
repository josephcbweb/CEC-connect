import { Trash2 } from "lucide-react";

interface DeleteBtnProps {
  onClick: () => void;
}

const DeleteBtn: React.FC<DeleteBtnProps> = ({ onClick }) => {
  return (
    <div className="flex items-center gap-1 border-1 border-red-500 p-1.5 rounded-sm hover:bg-red-100 cursor-pointer" onClick={onClick}>
      <span className="text-red-600">Delete</span>
      <button
        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};


export default DeleteBtn;