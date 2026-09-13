import { InstructorApplication } from './InstructorApplication';
import { Schedule } from './Schedule';
import { Session } from './Session';
import { User } from './User';

Schedule.hasMany(Session, { foreignKey: 'scheduleId', as: 'sessions', onDelete: 'CASCADE' });
Session.belongsTo(Schedule, { foreignKey: 'scheduleId', as: 'schedule' });
Session.hasMany(InstructorApplication, { foreignKey: 'sessionId', as: 'applications', onDelete: 'CASCADE' });
InstructorApplication.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });
User.hasMany(InstructorApplication, { foreignKey: 'instructorId', as: 'applications', onDelete: 'CASCADE' });
InstructorApplication.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
