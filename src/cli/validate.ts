import { collectVideoIssues, formatValidationIssue } from "../engine";
import { listVideos } from "../videos";

const videos = listVideos();
let failed = false;

for (const video of videos) {
  const issues = collectVideoIssues(video);
  if (issues.length === 0) {
    console.log(`${video.id}: ok`);
    continue;
  }
  failed = true;
  for (const issue of issues) {
    console.error(formatValidationIssue(issue));
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`${String(videos.length)} videos valid`);
}
