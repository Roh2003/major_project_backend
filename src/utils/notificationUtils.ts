import axios from 'axios';
import prisma from '../prisma';

interface NotificationPayload {
    title: string;
    content: string;
    data?: Record<string, any>;
    includedSegments?: string[];
    includedPlayerIds?: string[];
    big_picture?: string;
    sendAfter?: string;
}

export const sendOneSignalNotification = async (payload: NotificationPayload) => {
    try {
        const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
        const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;


        if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
            throw new Error('OneSignal credentials are not configured');
        }

        const options = {
            method: 'POST',
            url: 'https://onesignal.com/api/v1/notifications',
            headers: {
                accept: 'application/json',
                Authorization: `Key ${ONESIGNAL_API_KEY}`,
                'content-type': 'application/json'
            },
            data: {
                app_id: ONESIGNAL_APP_ID,
                contents: { en: payload.content },
                headings: { en: payload.title },
                include_player_ids: payload.includedPlayerIds,
                data: payload.data ?? {},
                typeId: payload.data?.type === 'announcement'
                    ? payload.data?.announcement
                    : payload.data?.type === 'broadcast'
                        ? payload.data?.broadcast
                        : payload.data?.type === 'polls'
                            ? payload.data?.polls
                            : undefined,
                big_picture: payload.big_picture ?? "",
                send_after: payload.sendAfter ?? undefined
            }
        };

        const response = await axios.request(options);
        if (!payload.includedPlayerIds?.length) return response.data;

        const users = await prisma.user.findMany({
            where: {
                playerId: { in: payload.includedPlayerIds },
            },
        });

        if (users.length === 0) return response.data;

        const notification = await prisma.notification.create({
            data: {
                title: payload.title,
                content: payload.content,
                description: payload.data?.description,
                page: payload.data?.page,
                route: payload.data?.route,
                type: payload.data?.type,
                typeId: payload.data?.type === 'announcement'
                    ? payload.data?.announcementId
                    : payload.data?.type === 'broadcast'
                        ? payload.data?.broadcastId
                        : payload.data?.type === 'polls'
                            ? payload.data?.formId
                            : undefined,
                image: payload.big_picture ?? undefined,
            },
        });

        const mappings = users.map((user) => ({
            userId: user.id,
            notificationId: notification.id,
        }));

        await prisma.notificationMapping.createMany({ data: mappings });

        return response.data;
    } catch (error) {
        console.error('Error sending OneSignal notification:', error);
        throw error;
    }
}; 