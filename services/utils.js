"use strict";

async function check_order_input(input) {
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
    check_order_input
};
