import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AutoLogout = ({ tiempo = 2 * 60 * 60 * 1000 }) => {
    const navigate = useNavigate();

    useEffect(() => {
        let timeout;
        const logout = () => {
            localStorage.removeItem("user");
            localStorage.removeItem("paciente");
            localStorage.removeItem("admin");
            localStorage.removeItem("medico");
            navigate("/");
        };

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(logout, tiempo);
        };

        const events = ["mousemove", "keydown", "mousedown", "touchstart"];
        events.forEach((e) => window.addEventListener(e, resetTimer));
        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach((e) => window.removeEventListener(e, resetTimer));
        };
    }, [navigate, tiempo]);

    return null;
};

export default AutoLogout;