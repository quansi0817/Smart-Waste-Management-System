package ca.sheridancollege.smartwaste.services;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ca.sheridancollege.smartwaste.beans.TrashBin;
import ca.sheridancollege.smartwaste.beans.Sensor;
import ca.sheridancollege.smartwaste.repositories.TrashBinRepository;
import lombok.AllArgsConstructor;

@Transactional
@Service
@AllArgsConstructor
public class TrashBinServiceImpl implements TrashBinService {

    // Constants
    private static final int ALERT_INTERVAL_HOURS = 1;
    private static final float PERCENTAGE_MULTIPLIER = 100f;

    private TrashBinRepository trashBinRepository;
    private MailService mailService;

    /**
     * Calculate fill percentage based on bin height and distance reading
     * Formula: (height - distance) / height * 100
     */
    private float calculateFillPercentage(float height, float distanceReading) {
        if (height <= 0.0F) {
            System.out.println("Invalid bin height: " + height);
            return 0.0F;
        }

        // Prevent distance reading from exceeding bin height
        if (distanceReading > height) {
            System.out.println("Distance reading (" + distanceReading + "cm) exceeds bin height (" + height
                    + "cm). Setting to height.");
            distanceReading = height;
        }

        float fillPercentage = (height - distanceReading) / height * PERCENTAGE_MULTIPLIER;

        // Ensure percentage is within valid range (0-100%)
        return Math.max(0.0F, Math.min(100.0F, fillPercentage));
    }

    @Override
    public void trashBinFillAndAlert(Sensor sensor, float distanceReading) {
        TrashBin bin = trashBinRepository.findBySensor(sensor);
        if (bin == null) {
            System.out.println("No bin found for sensor ID: " + sensor.getId());
            return;
        }

        float fill = calculateFillPercentage(bin.getHeight(), distanceReading);
        System.out.println("Bin: " + bin.getName() + ", Fill: " + fill + "%");

        // Update current fill percentage
        bin.setCurrentFillPercentage(fill);

        if (fill >= bin.getThreshold()) {
            LocalDateTime now = LocalDateTime.now();

            // First time or over 1 hour later
            if (bin.getLastAlertTime() == null ||
                 bin.getLastAlertTime().isBefore(now.minusHours(ALERT_INTERVAL_HOURS))) {
                mailService.sendThresholdAlertToCleaners(bin, fill);
                bin.setLastAlertTime(now);
                System.out.println("Alert sent: " + bin.getName());
            }
            trashBinRepository.save(bin);
        } else {
            // Fill level is normal, reset alert time
            if (bin.getLastAlertTime() != null) {
                bin.setLastAlertTime(null);
            }
            trashBinRepository.save(bin);
        }
    }
}
