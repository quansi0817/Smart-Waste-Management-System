import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { Trashbins } from '../trashbins';
import { TrashbinsService } from '../trashbins.service';

@Component({
  selector: 'app-trashbins-add',
  standalone: true,
  imports: [
    GoogleMapsModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './trashbins-add.component.html',
  styleUrl: './trashbins-add.component.css'
})
export class TrashbinsAddComponent implements OnInit {
  trashbinForm!: FormGroup;
  center = { lat: 43.4673, lng: -79.7000 };
  markerPosition = { lat: 43.4673, lng: -79.7000 };
  locationAddress = '';

  // Map options to hide unnecessary elements 
  mapOptions: any = {
    disableDefaultUI: true,           // Hide all default controls
    zoomControl: true,                // Keep only zoom control
    mapTypeControl: false,            // Hide map type control
    scaleControl: false,              // Hide scale
    streetViewControl: false,         // Hide street view
    styles: [
      {
        featureType: 'poi.business',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]  // Hide business POI only
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]  // Hide transit stations
      }
    ]
  };

  constructor(
    private trashbinsService: TrashbinsService,
    private router: Router,
    private fb: FormBuilder
  ) {}



  // Check if a form field is invalid and has been touched by the user
  isInvalid = (field: string) => {
    const f = this.trashbinForm.get(field);
    return !!(f?.invalid && f?.touched);
  }

  // Check if a form field has a specific validation error
  hasError = (field: string, error: string) =>
    !!this.trashbinForm.get(field)?.errors?.[error];

  // Update marker position when clicking on map - click-to-select location
  updateMarker(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.getAddressFromCoordinates(this.markerPosition.lat, this.markerPosition.lng);
    }
  }

  // Get address from coordinates using reverse geocoding
  getAddressFromCoordinates(lat: number, lng: number) {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        this.locationAddress = results[0].formatted_address;
      } else {
        this.locationAddress = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    });
  }

  // Save trashbin to server
  saveTrashbins(): void {
    if (this.trashbinForm.invalid) {
      this.trashbinForm.markAllAsTouched();
      return;
    }

    const { name, height, createdDate, threshold, cleaners, sensor } = this.trashbinForm.value;

    const data = {
      name,
      height,
      createdDate,
      threshold,
      cleanerIds: cleaners,
      sensor: sensor ? { id: sensor } : null,
      location: {
        address: this.locationAddress,
        latitude: this.markerPosition.lat,
        longitude: this.markerPosition.lng
      }
    };

    this.trashbinsService.create(data).subscribe({
      next: (response: Trashbins) => {
        this.trashbinsService.onTrashbinsAdded.emit(response);
        alert("Trashbin saved successfully!");
        this.router.navigate(['view/trashbins']);
      },
      error: (error) => {
        alert("Error saving trashbin: " + error.message);
      }
    });
  }
}
