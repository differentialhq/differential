export function LiveGreenCircle() {
  return (
    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
  );
}

export function SmallLiveGreenCircle() {
  return (
    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
  );
}

export function LiveAmberCircle() {
  return (
    <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>
  );
}

export function DeadRedCircle() {
  return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
}

export function DeadGreenCircle() {
  return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
}

export function DeadGrayCircle() {
  // a gray circle that is gray when the machine is dead
  return <div className="w-4 h-4 rounded-full bg-gray-500"></div>;
}

export function functionStatusToCircle(status: string) {
  // "pending", "running", "success", "failure"
  switch (status) {
    case "pending":
      return <LiveAmberCircle />;
    case "running":
      return <LiveGreenCircle />;
    case "success":
      return <DeadGreenCircle />;
    case "failure":
      return <DeadRedCircle />;
    case "stalled":
      return <DeadRedCircle />;
    default:
      return <DeadGrayCircle />;
  }
}

export function deploymentStatusToCircle(status: string) {
  // "uploading", "ready", "active", "inactive"
  switch (status) {
    case "uploading":
    case "ready":
      return <LiveAmberCircle />;
    case "active":
      return <LiveGreenCircle />;
    default:
      return <DeadGrayCircle />;
  }
}
