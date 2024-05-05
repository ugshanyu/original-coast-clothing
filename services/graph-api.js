/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

// Imports dependencies
const config = require("./config"),
  fetch = require("node-fetch"),
  { URL, URLSearchParams } = require("url");

module.exports = class GraphApi {

//   static async getUserMessageId(userIdInput) {
//     let url = new URL(`${config.apiUrl}/${config.pageId}/conversations`);
//     url.search = new URLSearchParams({
//       access_token: 'EAAF73V712WkBO98u17GdcmN2MiZAqFK7KDTYp0DGOrHtfH4GEFO1PfbzzIkuZBOXjx4qAer38B4xqiTcr1qIG3asoPdy5zpszjPV3VQqERi1tIwhGZB7QVZAhQ9Uz8NbZCKuZBY4P8OWmncoFDEodQV2NhpiyvtR99wWJJGkgpEc0S55Rs1NtziTJyBqMJa3B9',
//       platform: "messenger",
//       user_id: userIdInput
//     });
//     try {
//       const response = await fetch(url);
//       if (response.ok) {
//           const data = await response.json();
//           let userId = data['data'][0]['id']
//           return userId
//       } else {
//           throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
//       }
//     } catch (error) {
//         console.error('Error fetching conversations:', error);
//     }
//   }

//   static async getUserConversation(conversationId) {
//     let url = new URL(`${config.apiUrl}/${conversationId}`);
//     url.search = new URLSearchParams({
//       access_token: 'EAAF73V712WkBO98u17GdcmN2MiZAqFK7KDTYp0DGOrHtfH4GEFO1PfbzzIkuZBOXjx4qAer38B4xqiTcr1qIG3asoPdy5zpszjPV3VQqERi1tIwhGZB7QVZAhQ9Uz8NbZCKuZBY4P8OWmncoFDEodQV2NhpiyvtR99wWJJGkgpEc0S55Rs1NtziTJyBqMJa3B9',
//       fields: "messages.limit(3){id}", // Requesting the last 5 messages and only their IDs
//       // fields: "messages"
//       // platform: 'messenger',
//       // user_id: '7578764405496093'
//     });
//     try {
//       const response = await fetch(url);
//       if (response.ok) {
//           const data = await response.json();
//           // console.log("const data",data)
//           const messageIds = data.messages.data.map(msg => msg.id); // Extracting message IDs
//           // console.log("Fetched Message IDs:", messageIds);
//           return messageIds; // Returning only the message IDs
//       } else {
//           throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
//       }
//     } catch (error) {
//         console.error('Error fetching conversations:', error);
//     }
//   }

//   static async getMessages(messageIds) {
//     const final_list = [];

//     // Create an array of promises for each message ID fetch operation
//     const promises = messageIds.map(id => {
//         let url = new URL(`${config.apiUrl}/${id}`);
//         url.search = new URLSearchParams({
//             access_token: 'EAAF73V712WkBO98u17GdcmN2MiZAqFK7KDTYp0DGOrHtfH4GEFO1PfbzzIkuZBOXjx4qAer38B4xqiTcr1qIG3asoPdy5zpszjPV3VQqERi1tIwhGZB7QVZAhQ9Uz8NbZCKuZBY4P8OWmncoFDEodQV2NhpiyvtR99wWJJGkgpEc0S55Rs1NtziTJyBqMJa3B9',
//             fields: "message,from"
//             // additional parameters can be included here if necessary
//         });

//         // Return fetch promise
//         return fetch(url)
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error(`HTTP error! Status: ${response.status}`);
//                 }
//                 return response.json();
//             })
//             // .then(messageDetails => {
//             //     console.log("Message Details:", messageDetails);
//             //     return messageDetails; // return details to be included in final_list
//             // })
//             .catch(error => {
//                 console.error('Error fetching message details for ID:', id, error);
//                 return null; // Optionally return null or similar if there's an error
//             });
//     });

//     // Wait for all promises to resolve and then return the results
//     const results = await Promise.all(promises);
//     console.log("All messages have been fetched.");
//     return results.filter(result => result !== null); // Filter out any null results due to errors
// }

  static async callSendApi(requestBody) {
    let url = new URL(`${config.apiUrl}/me/messages`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken
    });
    console.log("Profile")
    console.log("Profile")
    console.warn("Request body is\n" + JSON.stringify(requestBody));
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      console.warn(
        `Unable to call Send API: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callMessengerProfileAPI(requestBody) {
    // Send the HTTP request to the Messenger Profile API

    console.log(`Setting Messenger Profile for app ${config.appId}`);
    let url = new URL(`${config.apiUrl}/me/messenger_profile`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken
    });
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.warn(
        `Unable to callMessengerProfileAPI: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callSubscriptionsAPI(customFields) {
    // Send the HTTP request to the Subscriptions Edge to configure your webhook
    // You can use the Graph API's /{app-id}/subscriptions edge to configure and
    // manage your app's Webhooks product
    // https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge
    console.log(
      `Setting app ${config.appId} callback url to ${config.webhookUrl}`
    );

    let fields =
      "messages, messaging_postbacks, messaging_optins, " +
      "message_deliveries, messaging_referrals";

    if (customFields !== undefined) {
      fields = fields + ", " + customFields;
    }

    console.log({ fields });

    let url = new URL(`${config.apiUrl}/${config.appId}/subscriptions`);
    url.search = new URLSearchParams({
      access_token: `${config.appId}|${config.appSecret}`,
      object: "page",
      callback_url: config.webhookUrl,
      verify_token: config.verifyToken,
      fields: fields,
      include_values: "true"
    });
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.error(
        `Unable to callSubscriptionsAPI: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callSubscribedApps(customFields) {
    // Send the HTTP request to subscribe an app for Webhooks for Pages
    // You can use the Graph API's /{page-id}/subscribed_apps edge to configure
    // and manage your pages subscriptions
    // https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
    console.log(`Subscribing app ${config.appId} to page ${config.pageId}`);

    let fields =
      "messages, messaging_postbacks, messaging_optins, " +
      "message_deliveries, messaging_referrals";

    if (customFields !== undefined) {
      fields = fields + ", " + customFields;
    }

    console.log({ fields });

    let url = new URL(`${config.apiUrl}/${config.pageId}/subscribed_apps`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken,
      subscribed_fields: fields
    });
    let response = await fetch(url, {
      method: "POST"
    });
    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.error(
        `Unable to callSubscribedApps: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async getUserProfile(senderIgsid) {
    let url = new URL(`${config.apiUrl}/${senderIgsid}`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken,
      fields: "first_name, last_name, gender, locale, timezone"
    });
    let response = await fetch(url);
    if (response.ok) {
      let userProfile = await response.json();
      return {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        gender: userProfile.gender,
        locale: userProfile.locale,
        timezone: userProfile.timezone
      };
    } else {
      console.warn(
        `Could not load profile for ${senderIgsid}: ${response.statusText}`,
        await response.json()
      );
      return null;
    }
  }

  static async getPersonaAPI() {
    // Send the POST request to the Personas API
    console.log(`Fetching personas for app ${config.appId}`);

    let url = new URL(`${config.apiUrl}/me/personas`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken
    });
    let response = await fetch(url);
    if (response.ok) {
      let body = await response.json();
      return body.data;
    } else {
      console.warn(
        `Unable to fetch personas for ${config.appId}: ${response.statusText}`,
        await response.json()
      );
      return null;
    }
  }

  static async postPersonaAPI(name, profile_picture_url) {
    let requestBody = {
      name,
      profile_picture_url
    };
    console.log(`Creating a Persona for app ${config.appId}`);
    console.log({ requestBody });
    let url = new URL(`${config.apiUrl}/me/personas`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken
    });
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      console.log(`Request sent.`);
      let json = await response.json();
      return json.id;
    } else {
      console.error(
        `Unable to postPersonaAPI: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callNLPConfigsAPI() {
    // Send the HTTP request to the Built-in NLP Configs API
    // https://developers.facebook.com/docs/graph-api/reference/page/nlp_configs/

    console.log(`Enable Built-in NLP for Page ${config.pageId}`);

    let url = new URL(`${config.apiUrl}/me/nlp_configs`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken,
      nlp_enabled: true
    });
    let response = await fetch(url, {
      method: "POST"
    });
    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.error(`Unable to activate built-in NLP: ${response.statusText}`);
    }
  }

  static async reportLeadSubmittedEvent(psid) {
    let url = new URL(`${config.apiUrl}/${config.appId}/page_activities`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken
    });
    let requestBody = {
      custom_events: [
        {
          _eventName: "lead_submitted"
        }
      ],
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      page_id: config.pageId,
      page_scoped_user_id: psid,
      logging_source: "messenger_bot",
      logging_target: "page"
    };
    console.warn(
      "Request to " + url + "\nWith body:\n" + JSON.stringify(requestBody)
    );
    try {
      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        console.warn(
          `Unable to call App Event API: ${response.statusText}`,
          await response.json()
        );
      }
    } catch (error) {
      console.error("Error while reporting lead submitted", error);
    }
  }
};
