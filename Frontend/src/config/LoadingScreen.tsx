import Lottie from "lottie-react";
import animationData from "../Sandy_Loading.json"; // Use the specific file name verbatim

const LoadingScreen = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f4f4f4'
        }}>
            <Lottie
                animationData={animationData}
                loop={true}
                style={{ width: 250, height: 250 }}
            />
        </div>
    );
};

export default LoadingScreen;