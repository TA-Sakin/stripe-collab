export const videoSetup = async (props) => {
  const response = await fetch("/setup-video-page", {
    method: "get",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    console.log(response);
    console.log("Video Setup: Error happened while fetching data");
    return null;
  }
  const data = await response.json();
  return data;
};
