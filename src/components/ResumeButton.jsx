const ResumeButton = ({ magnet, resumeTime }) => {
  const handleResume = () => {
    // Navigate to player with resume time
    window.location.href = `/player/${encodeURIComponent(magnet)}?resume=${resumeTime}`;
  };

  return (
    <button onClick={handleResume} className="bg-green-600 text-white p-2 rounded">
      Resume from {Math.floor(resumeTime / 60)}:{(resumeTime % 60).toFixed(0).padStart(2, '0')}
    </button>
  );
};

export default ResumeButton;