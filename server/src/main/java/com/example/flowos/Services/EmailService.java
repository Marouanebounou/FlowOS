package com.example.flowos.Services;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${mail.from:no-reply@flowos.local}")
    private String mailFrom;

    @Value("${mail.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public void sendOrganisationInvitation(String email, String organisationName, String token) {
        String invitationUrl = frontendUrl + "/invitations/" + token;

        if (!mailEnabled) {
            log.info("Organisation invitation token for {}: {}", email, invitationUrl);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("You have been invited to join " + organisationName + " on FlowOS");
        message.setText(
            "You have been invited to join " + organisationName + " on FlowOS.\n\n"
                + "Open this link to accept the invitation:\n"
                + invitationUrl + "\n\n"
                + "This invitation expires in 48 hours."
        );
        mailSender.send(message);
    }
}
