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

const Curation = require("./curation"),
  Order = require("./order"),
  Lead = require("./lead"),
  Response = require("./response"),
  Care = require("./care"),
  Survey = require("./survey"),
  GraphApi = require("./graph-api"),
  Profile = require("./profile"),
  Groq = require("./groq"),
  i18n = require("../i18n.config"),
  config = require("./config");

module.exports = class Receive {
  constructor(user, webhookEvent, isUserRef) {
    this.user = user;
    this.webhookEvent = webhookEvent;
    this.isUserRef = isUserRef;
  }

  // Check if the event is a message or postback and
  // call the appropriate handler function
  async handleMessage(socket, users) {
    let event = this.webhookEvent;
    console.log(Profile)
    // Profile.setPersistentMenu()
    let responses;
    try {
      if (event.message) {
        let message = event.message;
        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else if (message.attachments) {
          responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = await this.handleTextMessage(users, socket);
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      } else if (event.referral) {
        responses = this.handleReferral();
      } else if (event.optin) {
        responses = this.handleOptIn();
      } else if (event.pass_thread_control) {
        responses = this.handlePassThreadControlHandover();
      }
    } catch (error) {
      console.error(error);
      responses = {
        text: `An error has occured: '${error}'. We have been notified and \
        will fix the issue shortly!`
      };
    }

    if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 2000, this.isUserRef, socket, users);
        delay++;
      }
    } else {
      this.sendMessage(responses, this.isUserRef, socket, users);
    }
  }

  // Handles messages events with text
  async handleTextMessage(users, socket) {
    // console.log("Received text:",`${this.webhookEvent.message.text} for ${this.user.psid}`);
    
    let event = this.webhookEvent;

    // check greeting is here and is confident
    let greeting = this.firstEntity(event.message.nlp, "greetings");
    let message = event.message.text.trim().toLowerCase();

    let context = "";
    let send_message = ""
    if (users[this.user.psid] && users[this.user.psid].message && users[this.user.psid].message.length > 0) {
        // Get the last 3 messages or less if fewer are available
        let history = users[this.user.psid].message.slice(-3);
        context = history.map(msg => `user: \n${msg.received} \nassistant: \n${msg.response}`).join("\n");
    }
    let formattedMessage = context + "\nuser: \n" + message;
    if(users[this.user.psid]['status'] == "require_order_number"){
      console.log("1")
      send_message = await Groq.extract_order_info(formattedMessage)
      if(send_message != "AGAIN"){
        users[this.user.psid]['status'] = ""
      }
      if(send_message == "NONE"){
        console.log("2")
        let classified = await Groq.returnCompletion(formattedMessage)
        console.log("classified", classified)
        send_message = await Groq.return_related_info(this.user.psid, formattedMessage, classified, socket, users)
      } else if (send_message == "AGAIN"){

      } else {
        send_message = `check_order_info(${send_message}, token)` 
      }
    } else {
      console.log("2")
      let classified = await Groq.returnCompletion(formattedMessage)
      console.log("classified", classified)
      send_message = await Groq.return_related_info(this.user.psid, formattedMessage, classified, socket, users)
    }
    console.log("send_message", send_message)
    // let response = Response.genText(send_message)
    // let response = [Response.genText(await Groq.returnCompletion(message))]
    // console.log("messagemessagemessage", message)
    // console.log("responseresponseresponse", response["text"])
    // console.log("users", users)
    // users[this.user.psid]

    if (users[this.user.psid]) {
      // Initialize the message list if it does not exist
      if (!users[this.user.psid].message) {
          users[this.user.psid].message = [];
      }
      // Append new object to the message list
      users[this.user.psid].message.push({
          received: message,
          response: send_message
      });
      // console.log("users[this.user.psid]", users[this.user.psid])
    }

    return Response.genText(send_message);
  }

  // Handles mesage events with attachments
  handleAttachmentMessage() {
    let response;

    // Get the attachment
    let attachment = this.webhookEvent.message.attachments[0];
    console.log("Received attachment:", `${attachment} for ${this.user.psid}`);

    response = Response.genQuickReply(i18n.__("fallback.attachment"), [
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: i18n.__("menu.start_over"),
        payload: "GET_STARTED"
      }
    ]);

    return response;
  }

  // Handles mesage events with quick replies
  handleQuickReply() {
    // Get the payload of the quick reply
    let payload = this.webhookEvent.message.quick_reply.payload;

    return this.handlePayload(payload);
  }

  // Handles postbacks events
  handlePostback() {
    let postback = this.webhookEvent.postback;
    // Check for the special Get Starded with referral
    let payload;
    if (postback.referral && postback.referral.type == "OPEN_THREAD") {
      payload = postback.referral.ref;
    } else if (postback.payload) {
      // Get the payload of the postback
      payload = postback.payload;
    }
    if (payload.trim().length === 0) {
      console.log("Ignore postback with empty payload");
      return null;
    }

    return this.handlePayload(payload.toUpperCase());
  }

  // Handles referral events
  handleReferral() {
    // Get the payload of the postback
    let type = this.webhookEvent.referral.type;
    if (type === "LEAD_COMPLETE" || type === "LEAD_INCOMPLETE") {
      let lead = new Lead(this.user, this.webhookEvent);
      return lead.handleReferral(type);
    }
    if (type === "OPEN_THREAD") {
      let payload = this.webhookEvent.referral.ref.toUpperCase();
      if (payload.trim().length === 0) {
        console.log("Ignore referral with empty payload");
        return null;
      }
      return this.handlePayload(payload);
    }
    console.log("Ignore referral of invalid type");
  }

  // Handles optins events
  handleOptIn() {
    let optin = this.webhookEvent.optin;
    // Check for the special Get Starded with referral
    let payload;
    if (optin.type === "notification_messages") {
      payload = "RN_" + optin.notification_messages_frequency.toUpperCase();
      this.sendRecurringMessage(optin.notification_messages_token, 5000);
      return this.handlePayload(payload);
    }
    return null;
  }

  handlePassThreadControlHandover() {
    let new_owner_app_id =
      this.webhookEvent.pass_thread_control.new_owner_app_id;
    let previous_owner_app_id =
      this.webhookEvent.pass_thread_control.previous_owner_app_id;
    let metadata = this.webhookEvent.pass_thread_control.metadata;
    if (config.appId === new_owner_app_id) {
      console.log("Received a handover event, but is not for this app");
      return;
    }
    const lead_gen_app_id = 413038776280800; // App id for Messenger Lead Ads
    if (previous_owner_app_id === lead_gen_app_id) {
      console.log(
        "Received a handover event from Lead Generation Ad will handle Referral Webhook Instead"
      );
      return;
    }
    // We have thread control but no context on what to do, default to New User Experience
    return Response.genNuxMessage(this.user);
  }

  handlePayload(payload) {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);

    let response;

    // Set the response based on the payload
    if (
      payload === "GET_STARTED" ||
      payload === "DEVDOCS" ||
      payload === "GITHUB"
    ) {
      response = Response.genNuxMessage(this.user);
    } else if (
      payload.includes("CURATION") ||
      payload.includes("COUPON") ||
      payload.includes("PRODUCT_LAUNCH")
    ) {
      let curation = new Curation(this.user, this.webhookEvent);
      response = curation.handlePayload(payload);
    } else if (payload.includes("CARE")) {
      let care = new Care(this.user, this.webhookEvent);
      response = care.handlePayload(payload);
    } else if (payload.includes("ORDER")) {
      response = Order.handlePayload(payload);
    } else if (payload.includes("CSAT")) {
      response = Survey.handlePayload(payload);
    } else if (payload.includes("CHAT-PLUGIN")) {
      response = [
        Response.genText(i18n.__("chat_plugin.prompt")),
        Response.genText(i18n.__("get_started.guidance")),
        Response.genQuickReply(i18n.__("get_started.help"), [
          {
            title: i18n.__("care.order"),
            payload: "CARE_ORDER"
          },
          {
            title: i18n.__("care.billing"),
            payload: "CARE_BILLING"
          },
          {
            title: i18n.__("care.other"),
            payload: "CARE_OTHER"
          }
        ])
      ];
    } else if (payload.includes("BOOK_APPOINTMENT")) {
      response = [
        Response.genText(i18n.__("care.appointment")),
        Response.genText(i18n.__("care.end"))
      ];
    } else if (payload === "RN_WEEKLY") {
      response = {
        text: `[INFO]The following message is a sample Recurring Notification for a weekly frequency. This is usually sent outside the 24 hour window to notify users on topics that they have opted in.`
      };
    } else if (payload.includes("WHOLESALE_LEAD")) {
      let lead = new Lead(this.user, this.webhookEvent);
      response = lead.handlePayload(payload);
    } else {
      response = {
        text: `This is a default postback message for payload: ${payload}!`
      };
    }

    return response;
  }

  handlePrivateReply(type, object_id) {
    let welcomeMessage =
      i18n.__("get_started.welcome") +
      " " +
      i18n.__("get_started.guidance") +
      ". " +
      i18n.__("get_started.help");

    let response = Response.genQuickReply(welcomeMessage, [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION"
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: i18n.__("menu.product_launch"),
        payload: "PRODUCT_LAUNCH"
      }
    ]);

    let requestBody = {
      recipient: {
        [type]: object_id
      },
      message: response
    };
    GraphApi.callSendApi(requestBody);
  }

  sendMessage(response, delay = 0, isUserRef, socket, users) {
    // const delay = 1000; // Delay in milliseconds
    // setTimeout(async () => {
    //     const messageIds = await GraphApi.getUserConversation(this.user.psid);

    //     if (messageIds) {
    //         GraphApi.getMessages(messageIds);
    //     }
    // }, delay);
    // setTimeout(async () => {
    //   let messageSessionId = await GraphApi.getUserMessageId(this.user.psid);
    //   // console.log("messageSessionId", messageSessionId)
    //   let x = await GraphApi.getUserConversation(messageSessionId);
    //   let y = await GraphApi.getMessages(x);
    //   console.log("y", y[1])
    //   const dataToSend = {
    //     id: "Usion",
    //     data: y[1]['message'],
    //     user_id: y[1]['from']['id']
    //   };
    //   socket.emit('all_at_once_userId', dataToSend);
    //   // socket.emit('all_at_once', dataToSend);
    //   // GraphApi.callSendApi(requestBody)
    //   // console.log("y", y)
    // }, delay);
    // setTimeout(() => GraphApi.getMessages(this.user.psid), delay);
    // GraphApi.getUserConversations(this.user.psid)
    // Check if there is delay in the response
    if (response === undefined || response === null) {
      return;
    }
    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }
    // Construct the message body
    let requestBody = {};
    if (isUserRef) {
      // For chat plugin
      requestBody = {
        recipient: {
          id: this.user.psid
        },
        message: response
      };
    } else {
      requestBody = {
        recipient: {
          id: this.user.psid
        },
        message: response
      };
    }

    // Check if there is persona id in the response
    if ("persona_id" in response) {
      let persona_id = response["persona_id"];
      delete response["persona_id"];
      if (isUserRef) {
        // For chat plugin
        requestBody = {
          recipient: {
            id: this.user.psid
          },
          message: response,
          persona_id: persona_id
        };
      } else {
        requestBody = {
          recipient: {
            id: this.user.psid
          },
          message: response,
          persona_id: persona_id
        };
      }
    }
    // Mitigate restriction on Persona API
    // Persona API does not work for people in EU, until fixed is safer to not use
    delete requestBody["persona_id"];
    setTimeout(() => GraphApi.callSendApi(requestBody), delay);
  }

  sendRecurringMessage(notificationMessageToken, delay) {
    console.log("Received Recurring Message token");
    let requestBody = {},
      response,
      curation;
    //This example will send summer collection
    curation = new Curation(this.user, this.webhookEvent);
    response = curation.handlePayload("CURATION_BUDGET_50_DINNER");
    // Check if there is delay in the response
    if (response === undefined) {
      return;
    }
    requestBody = {
      recipient: {
        notification_messages_token: notificationMessageToken
      },
      message: response
    };

    setTimeout(() => GraphApi.callSendApi(requestBody), delay);
  }
  firstEntity(nlp, name) {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
  }

  handleReportLeadSubmittedEvent() {
    let requestBody = {
      custom_events: [
        {
          _eventName: "lead_submitted"
        }
      ],
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      page_id: config.pageId,
      page_scoped_user_id: this.user.psid,
      logging_source: "messenger_bot",
      logging_target: "page"
    };
    try {
      GraphApi.callAppEventApi(requestBody);
    } catch (error) {
      console.error("Error while reporting lead submitted", error);
    }
  }
};
