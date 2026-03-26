'use server'

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Workspace, { SerializedWorkspace } from "@/models/Workspace";

// --- INITIALIZATION ---
export async function getOrCreateDefaultWorkspace(): Promise<SerializedWorkspace> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        // Check if user already has any workspace
        let workspace = await Workspace.findOne({ ownerId: userId }).sort({ createdAt: 1 });

        // If not, create a default "Personal" workspace
        if (!workspace) {
            workspace = await Workspace.create({
                name: "Personal",
                type: "personal",
                ownerId: userId,
                members: [userId]
            });
        }

        return JSON.parse(JSON.stringify(workspace));
    } catch (error: any) {
        console.error("Error in getOrCreateDefaultWorkspace:", error);
        throw new Error(`Failed to get or create workspace: ${error.message}`);
    }
}

// --- READ ALL ---
export async function getAllWorkspaces(): Promise<SerializedWorkspace[]> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        // Fetch workspaces where user is owner OR a member
        const workspaces = await Workspace.find({
            $or: [
                { ownerId: userId },
                { members: userId }
            ]
        }).sort({ createdAt: 1 });

        return JSON.parse(JSON.stringify(workspaces));
    } catch (error: any) {
        console.error("Error fetching workspaces:", error);
        throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }
}

// --- CREATE ---
export async function createWorkspace({ name, type }: { name: string, type: 'personal' | 'work' }): Promise<SerializedWorkspace> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const newWorkspace = await Workspace.create({
            name,
            type,
            ownerId: userId,
            members: [userId] // Creator is default implicitly a member
        });

        return JSON.parse(JSON.stringify(newWorkspace));
    } catch (error: any) {
        console.error("Error creating workspace:", error);
        throw new Error(`Failed to create workspace: ${error.message}`);
    }
}
