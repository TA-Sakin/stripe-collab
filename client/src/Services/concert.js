export const concertSetup = async (props) => {
  const response = await fetch("/setup-concert-page", {
    method: "get",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    console.log(response);
    console.log("Concert Setup: Error happened while fetching data");
    return null;
  }
  const data = await response.json();
  return data;
};

export const concertSuccess = async (id) => {
  const response = await fetch(`/checkout-session?session-id=${id}`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    console.log(response);
    console.log("Concert Success: Error happened while fetching data");
    return null;
  }
  const data = await response.json();
  return data;
};
