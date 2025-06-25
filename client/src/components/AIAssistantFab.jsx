import { FaRobot } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const AIAssistantFab = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const location = useLocation();

    // Only show for farmers and not on the AI Assistant page itself
    if (!isAuthenticated || user?.role !== "farmer" || location.pathname === "/farmer/ai-assistant") {
        return null;
    }

    return (
        <button
            className="fixed bottom-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 lg:p-4 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
                boxShadow: "0 4px 16px rgba(34, 197, 94, 0.3)",
                minWidth: "3.5rem",
                minHeight: "3.5rem"
            }}
            aria-label="Open AI Assistant"
            onClick={() => navigate("/farmer/ai-assistant")}
        >
            <FaRobot size={20} className="lg:text-2xl" />
        </button>
    );
};

export default AIAssistantFab;
