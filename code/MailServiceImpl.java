package ca.sheridancollege.smartwaste.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import ca.sheridancollege.smartwaste.beans.TrashBin;
import ca.sheridancollege.smartwaste.beans.Cleaner;

@Service
public class MailServiceImpl implements MailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendThresholdAlertToCleaners(TrashBin bin, float fillLevel) {
        for (Cleaner cleaner : bin.getCleaners()) {
            if (cleaner.getEmail() != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(cleaner.getEmail());
                
                // Improved subject line with bin name and fill level
                message.setSubject("Alert: " + bin.getName() + " - " + String.format("%.1f", fillLevel) + "% Full");
                
                // Improved email body with cleaner greeting and location details
                String emailBody = String.format(
                    "Hi %s,\n\n" +
                    "Trash bin \"%s\" is %.1f%% full and requires attention.\n\n" +
                    "Location: %s\n\n" +
                    "Thanks,\n" +
                    "Smart Waste Management System",
                    cleaner.getName(),
                    bin.getName(),
                    fillLevel,
                    bin.getLocation() != null ? bin.getLocation().getAddress() : "Location not available"
                );
                
                message.setText(emailBody);
                
                try {
                    mailSender.send(message);
                } catch (Exception e) {
                    System.out.println("Failed to send email to: " + cleaner.getEmail());
                }
            }
        }
    }
}
