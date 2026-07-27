const cron = require('node-cron');
const Task = require('../models/Task');
const System = require('../models/System');
const Incident = require('../models/Incident');

const initializeCronJobs = (io) => {
  // Check for overdue tasks every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const overdueTasks = await Task.find({
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      }).populate('assignedTo system');

      overdueTasks.forEach(task => {
        console.log(`Task ${task.title} is overdue`);
        if (io) {
          io.emit('task_overdue', {
            taskId: task._id,
            title: task.title,
            dueDate: task.dueDate
          });
        }
      });
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  });

  // Check for low spare parts every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const systems = await System.find().populate('spareParts.part');
      
      systems.forEach(system => {
        system.spareParts.forEach(async (spare) => {
          if (spare.quantity < spare.minimumStock) {
            if (io) {
              io.emit('low_stock_alert', {
                systemId: system._id,
                systemName: system.name,
                partName: spare.part.name,
                quantity: spare.quantity
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Error checking spare parts:', error);
    }
  });

  // Generate maintenance reports daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const dailyTasks = await Task.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const dailyIncidents = await Incident.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      console.log(`Daily Report - ${today.toDateString()}`);
      console.log(`Tasks created: ${dailyTasks.length}`);
      console.log(`Incidents reported: ${dailyIncidents.length}`);

    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  });

  console.log('Cron jobs initialized');
};

module.exports = { initializeCronJobs };