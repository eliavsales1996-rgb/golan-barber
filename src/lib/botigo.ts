// src/lib/botigo.ts

interface BotigoEvent {
  type: 'NEW_BOOKING' | 'STATUS_UPDATE';
  data: any;
  timestamp: string;
}

export const syncToBotigo = async (event: BotigoEvent) => {
  console.log(`[Botigo Sync] Event Sent: ${event.type}`, event.data);
  
  // In a real implementation:
  // await fetch('https://api.botigo.io/webhook', {
  //   method: 'POST',
  //   body: JSON.stringify(event)
  // });
};
