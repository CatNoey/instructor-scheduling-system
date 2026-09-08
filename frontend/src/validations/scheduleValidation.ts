// src/validations/scheduleValidation.ts

import * as Yup from 'yup';

export const scheduleValidationSchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  institutionId: Yup.string().required('Institution is required'),
  region: Yup.string().required('Region is required'),
  capacity: Yup.number().positive('Capacity must be positive').required('Capacity is required'),
  trainingType: Yup.string().oneOf(['class', 'teacher', 'all_staff', 'remote', 'other'], 'Invalid training type').required('Training type is required'),
  status: Yup.string().oneOf(['open', 'closed', 'adjusted'], 'Invalid status').required('Status is required'),
});