/// <reference types="vite/client" />
import { useState, useEffect, useCallback } from 'react';
import firebaseConfig from '../../firebase-applet-config.json';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || (firebaseConfig as any).oAuthClientId;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export function useGoogleCalendar() {
  const [isReady, setIsReady] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not defined');
      return;
    }

    const loadGapi = async () => {
      // Load GSI client
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.async = true;
      gsiScript.defer = true;
      gsiScript.onload = () => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
            // Handled dynamically on request
          },
        });
        setTokenClient(client);
      };
      document.body.appendChild(gsiScript);

      // Load GAPI client
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load('client', () => {
          window.gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          }).then(() => {
            setIsReady(true);
          }).catch((err: any) => {
            console.error('Error loading GAPI client for API', err);
          });
        });
      };
      document.body.appendChild(gapiScript);
    };

    loadGapi();
  }, []);

  const createEvent = useCallback((event: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!tokenClient || !isReady) {
        console.error('Google Calendar not ready');
        resolve(false);
        return;
      }

      // Overwrite callback to handle this specific action
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          console.error(resp.error);
          resolve(false);
          return;
        }

        try {
          const request = window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
          const response = await request;
          console.log('Event created: ', response.result);
          resolve(true);
        } catch (error) {
          console.error('Error creating event', error);
          resolve(false);
        }
      };

      if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }, [tokenClient, isReady]);

  return { isReady, createEvent };
}
