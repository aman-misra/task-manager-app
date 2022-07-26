import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendWelcomeEmail = (email, name) => {
  sgMail
    .send({
      to: email,
      from: "amanmisraht@gmail.com",
      subject: "Welcome to the task manger application",
      text: `Hello, ${name}. Good to see you here.`,
      html: "<strong>Let me know if you face any trouble</strong>",
    })
    .then(
      () => {},
      (error) => {
        console.error(error);

        if (error.response) {
          console.error(error.response.body);
        }
      }
    );
};

export const sendCancellationEmail = (email, name) => {
  sgMail
    .send({
      to: email,
      from: "amanmisraht@gmail.com",
      subject: "Sorry to see you go.",
      text: `Hello, ${name}. We hope you will return soon.`,
      html: "<strong>Share your feedback.</strong>",
    })
    .then(
      () => {},
      (error) => {
        console.error(error);

        if (error.response) {
          console.error(error.response.body);
        }
      }
    );
};
