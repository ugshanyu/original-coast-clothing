"use strict";
const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: "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"
});

const classify = `Classify the user's utterance into following sections. Return only the key. if none of these related then return NONE.
{
  "order_check_status": "Use this category when the user inquires about the status of their order.",
  "collaboration_info": "Select this category if the user expresses interest in collaborating with us.",
  "human_assistant": "Choose this category if the user seeks human assistant.",
  "tax_return": "This category is for inquiries about tax returns, specifically in Mongolian (referred to as 'НӨАТ' or 'noat').",
  "delivery_info": "Use this category for questions regarding delivery costs or if delivery is available to a specific location.",
  "leasing": "Select this category for inquiries related to leasing information."
  "NONE": "Choose this, if users utterance is not related to none above."
}

Example interactions
user: Сайн уу миний захиалсан бараа хаана явж байгаа юм. assistant: order_check_status
user: Minii zahialsan baraa irj baigaa ym bolov uu?. assistant: order_check_status
user: bi zahialgaa tsutslah gesen ym assistant: return_policy
user: yaj hamtarj ajillah ve? assistant: collaboration_info
user: bi arhi uumaar baina assistant: NONE
user: Чи юу хийж байна assistant: NONE
user: Хөдөө орон нутагт хүргэлт байгаа юу assistant: delivery_info
user: Хүнтэй холбогдох гэсэн юм assistant: human_assistant
user Би танайд бараагаа байршуулах гэсэн юм хэнтэй яаж холбогдох билээ assistant: collaboration_info
user: huvgul aimagluu hurgelt baidag uu assistant: delivery_info
user: hooy bi jinhen huntei chatlmaar bauna assistant: human_assistant
user: Дархан хотлуу хүргэлт байдаг уу байдаг бол хэдэн төгрөг вэ? assistant: delivery_info

Now user asks:`

const check_input = `Extract the phone number or order number from the given text. Phone number should have 8 digit number. Order number should be in format of RXXXXXXXX and after R there should be 8 digits.
if user does not provide phone number or order number simply return NONE.
if user provides provide phone number or order number but the format is incorret ther return AGAIN.
Example interactions
user: minii utasnii dugaar 99905779 shuu assistant: 99905779
user: RSSDA@#D. assistant: AGAIN
user: bi zahialgaa tsutslah gesen ym assistant: NONE
user: yaj hamtarj ajillah ve? assistant: NONE
user: bi arhi uumaar baina assistant: NONE
user: 99905779 assistant: 99905779
user: R99223311  assistant: R99223311
user: R99223311gesen dugaar baina zov uu assistant: R99223311
user: R*922311 gesen dugaar baina zov uu assistant: AGAIN
user: 999057799 assistant: AGAIN

Now user asks:
`

const answer_based_on_text = `Answer solely based on provided information. Answer in Mongolian.`

async function return_related_info(user_id, messages, classified_input, socket, users) {
    // console.log("classified_input", classified_input)
    let result = {system_prompt: "Answer solely based on provided information. Answer in Mongolian.\nInformation:", generate: false, final_text: "", info: ""}
    if (classified_input == "tax_return") {
        result['final_text'] = "Таны захиалгын НӨАТ-ийн баримт нь худалдан авалтын хүргэлт хийгдсэнээс хойш ажлын 5 хоногт багтан таны бүртгэлтэй имэйл рүү илгээгдэх ба shoppy.mn аппликейшний захиалгууд хэсэгт хавсралтаар орно.";
    } else if (classified_input == "collaboration_info") {
        result['final_text'] = "Та өөрийн байршуулахаар хүсэж буй бараа бүтээгдэхүүний мэдээллийг sales@shoppy.mn гэсэн имэйл хаяганд илгээснээр хариуцсан харилцагчийн үйлчилгээний мэргэжилтэн тань руу холбогдож дэлгэрэнгүй мэдээлэл өгөх болно";
    } else if (classified_input == "delivery_info") {
        result['final_text'] = "Бид Дархан, Эрдэнэт хот руу албан ёсны хүргэлтээр 19,800₮-өөр захиалгыг хүргэж байна. Бусад аймагт захиалгыг замын унаанд тавьж хүргэж байна.";
    } else if (classified_input == "order_check_status") {
        users[user_id]["status"] = "require_order_number"
        result['final_text'] = "Та бүртгэлтэй утасны дугаар эсвэл захиалгийн RXXXXXXXXX дугаар аа оруулна уу?";
    } else if(classified_input == "NONE") {
        result['final_text'] = "Таны асуултан би хариулах боломжгүй байна. Та туслах ажилтантай холбогдохыг хүсэж байна уу?";
    } else if(classified_input == "human_assistant") {
        result['final_text'] = "ТУСЛАХ АЖИЛТАН";
    }else {
        result['system_prompt'] = "";
    }
    const dataToSend = {
        id: "Usion",
        data: result['system_prompt'] + result['info'] + messages,
        user_id: user_id
    };
    if(result['generate']){
        socket.emit('all_at_once_userId', dataToSend);
    }
    return result['final_text']
}

async function extract_order_info(messages) {
    const chatCompletion = await getGroqChatCompletion(messages, check_input);
    return chatCompletion.choices[0]?.message?.content || ""
}

async function returnCompletion(prompt) {
    const chatCompletion = await getGroqChatCompletion(prompt, classify);
    return chatCompletion.choices[0]?.message?.content || ""
}

async function getGroqChatCompletion(prompt, system_prompt) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: system_prompt
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama3-70b-8192"
    });
}

module.exports = {
    returnCompletion,
    getGroqChatCompletion,
    return_related_info,
    extract_order_info
};
