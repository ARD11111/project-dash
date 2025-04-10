import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function loadJson(fileName: string) {
  const filePath = path.join(__dirname, 'seedData', fileName);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

async function main() {
  try {
    const teamData = await loadJson('team.json');
    const projectData = await loadJson('project.json');
    const userData = await loadJson('user.json');
    const projectTeamData = await loadJson('projectTeam.json');
    const taskData = await loadJson('task.json');
    const attachmentData = await loadJson('attachment.json');
    const commentData = await loadJson('comment.json');
    const taskAssignmentData = await loadJson('taskAssignment.json');

    // Clear existing data
    await prisma.taskAssignment.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectTeam.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();

    // Create teams
    await Promise.all(
      teamData.map((team: any) =>
        prisma.team.create({ data: team })
      )
    );

    // Create projects
    await Promise.all(
      projectData.map((project: any) =>
        prisma.project.create({ data: project })
      )
    );

    // Create users
    await Promise.all(
      userData.map((user: any) =>
        prisma.user.create({
          data: {
            username: user.username,
            profilePictureUrl: user.profilePictureUrl || undefined,
            ...(user.teamId
              ? { team: { connect: { id: user.teamId } } }
              : {}),
          },
        })
      )
    );

    // Create project teams
    await Promise.all(
      projectTeamData.map((pt: any) =>
        prisma.projectTeam.create({
          data: {
            team: { connect: { id: pt.teamId } },
            project: { connect: { id: pt.projectId } },
          },
        })
      )
    );

    // Create tasks
    await Promise.all(
      taskData.map((task: any) =>
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            tags: task.tags,
            startDate: task.startDate ? new Date(task.startDate) : undefined,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            points: task.points,
            project: { connect: { id: task.projectId } },
            author: { connect: { userId: task.authorUserId } },
            ...(task.assignedUserId
              ? { assignee: { connect: { userId: task.assignedUserId } } }
              : {}),
          },
        })
      )
    );

    // Create attachments
    await Promise.all(
      attachmentData.map((a: any) =>
        prisma.attachment.create({
          data: {
            fileURL: a.fileURL,
            fileName: a.fileName,
            task: { connect: { id: a.taskId } },
            uploadedBy: { connect: { userId: a.uploadedById } },
          },
        })
      )
    );

    // Create comments
    await Promise.all(
      commentData.map((c: any) =>
        prisma.comment.create({
          data: {
            text: c.text,
            task: { connect: { id: c.taskId } },
            user: { connect: { userId: c.userId } },
          },
        })
      )
    );

    // Create task assignments
    await Promise.all(
      taskAssignmentData.map((ta: any) =>
        prisma.taskAssignment.create({
          data: {
            user: { connect: { userId: ta.userId } },
            task: { connect: { id: ta.taskId } },
          },
        })
      )
    );

    console.log(' Seed data inserted successfully');
  } catch (error) {
    console.error(' Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
