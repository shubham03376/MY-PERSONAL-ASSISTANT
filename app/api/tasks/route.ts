import { NextRequest, NextResponse } from "next/server";
import { getTasks, addTask } from "@/lib/vault-store";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await getTasks(session.sub);
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, dueDate, priority } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await addTask(session.sub, {
      title: title.trim(),
      completed: false,
      dueDate,
      priority: priority || "medium",
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err) {
    console.error("Failed to add task:", err);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
