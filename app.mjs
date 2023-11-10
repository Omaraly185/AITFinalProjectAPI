import express from "express";
import { google } from "googleapis";
import keys from "./the-scheduling-app.json" assert { type: "json" };
import cors from "cors";
const app = express();

app.use(cors());

const port = process.env.PORT || 4000;
const jwtClient = new google.auth.JWT({
  email: keys.client_email,
  key: keys.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

jwtClient.authorize((err, tokens) => {
  if (err) {
    console.error("Error during authorization:", err);
    return;
  }
  console.log("Authorization successful!");
});

app.get("/events", async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: jwtClient });

  let response;
  try {
    response = await calendar.events.list({
      calendarId: "obreezy1965@gmail.com",
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 9999,
    });
    console.log("Fetched events:", response.data.items);
    const events = response.data.items.map((event) => ({
      title: event.summary || "",
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));
    res.json(events);
  } catch (err) {
    console.error("Error fetching events list:", err);
    res.status(500).send("Error fetching events list: " + err);
  }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
