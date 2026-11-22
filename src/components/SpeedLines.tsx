export function SpeedLines() {
  const lines = Array.from({ length: 16 }, (_, index) => index);
  return (
    <svg className="speed-lines" viewBox="0 0 800 520" preserveAspectRatio="none" aria-hidden="true">
      {lines.map((index) => (
        <line
          key={index}
          x1={-40}
          y1={540}
          x2={30 + index * 54}
          y2={-30}
          stroke={index % 5 === 0 ? "#ff3d78" : "#fffaf1"}
          strokeWidth={index % 5 === 0 ? 7 : 2}
          opacity={index % 5 === 0 ? 0.7 : 0.18}
        />
      ))}
    </svg>
  );
}
