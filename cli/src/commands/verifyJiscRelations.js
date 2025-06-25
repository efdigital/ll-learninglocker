import logger from 'lib/logger';
import async from 'async';

import AssessmentInstance from 'lib/plugins/jisc_1_2_6/models/assessmentInstance';
import Course from 'lib/plugins/jisc_1_2_6/models/course';
import CourseInstance from 'lib/plugins/jisc_1_2_6/models/courseInstance';
import Institution from 'lib/plugins/jisc_1_2_6/models/institution';
import Module from 'lib/plugins/jisc_1_2_6/models/module';
import ModuleInstance from 'lib/plugins/jisc_1_2_6/models/moduleInstance';
import ModuleVleMap from 'lib/plugins/jisc_1_2_6/models/moduleVleMap';
import Staff from 'lib/plugins/jisc_1_2_6/models/staff';
import StaffCourseInstance from 'lib/plugins/jisc_1_2_6/models/staffCourseInstance';
import StaffModuleInstance from 'lib/plugins/jisc_1_2_6/models/staffModuleInstance';
import Student from 'lib/plugins/jisc_1_2_6/models/student';
import StudentAssessmentInstance from 'lib/plugins/jisc_1_2_6/models/studentAssessmentInstance';
import StudentCourseInstance from 'lib/plugins/jisc_1_2_6/models/studentCourseInstance';
import StudentCourseMembership from 'lib/plugins/jisc_1_2_6/models/studentCourseMembership';
import StudentModuleInstance from 'lib/plugins/jisc_1_2_6/models/studentModuleInstance';

const findAllModelsAndSave = async (schema) => {
  const models = await schema.find({});
  await Promise.all(models.map(model => model.save()));
};

export default async function () {
  logger.info('Updating relations...');

  try {
    await Promise.all([
      findAllModelsAndSave(AssessmentInstance),
      findAllModelsAndSave(Course),
      findAllModelsAndSave(CourseInstance),
      findAllModelsAndSave(Institution),
      findAllModelsAndSave(Module),
      findAllModelsAndSave(ModuleInstance),
      findAllModelsAndSave(ModuleVleMap),
      findAllModelsAndSave(Staff),
      findAllModelsAndSave(StaffCourseInstance),
      findAllModelsAndSave(StaffModuleInstance),
      findAllModelsAndSave(Student),
      findAllModelsAndSave(StudentAssessmentInstance),
      findAllModelsAndSave(StudentCourseInstance),
      findAllModelsAndSave(StudentCourseMembership),
      findAllModelsAndSave(StudentModuleInstance),
    ]);
    logger.info('All relations updated.');
    process.exit();
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
