
import { lessonProgressService } from './lesson-progress.service';
import { courseProgressService } from './course-progress.service';
import { lastViewedService } from './last-viewed.service';

export const progressService = {
  ...lessonProgressService,
  ...courseProgressService,
  ...lastViewedService
};
