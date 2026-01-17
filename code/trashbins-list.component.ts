import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Trashbins } from '../trashbins';
import { TrashbinsService } from '../trashbins.service';

@Component({
  selector: 'app-trashbins-list',
  standalone: true,
  imports: [
    GoogleMapsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './trashbins-list.component.html',
  styleUrl: './trashbins-list.component.css',
})
export class TrashbinsListComponent implements OnInit {
  trashbins: Trashbins[] = [];
  filteredTrashbins: Trashbins[] = [];
  activeFilter = 'all'; // 'all' or 'full'

  // Map configuration
  mapCenter = { lat: 43.4691, lng: -79.7003 }; // Sheridan College
  mapZoom = 15;
  selectedBinId: any = null;

  // Map options to hide unnecessary elements
  mapOptions: any = {
    disableDefaultUI: true, // Hide all default controls
    zoomControl: true, // Keep only zoom control
    mapTypeControl: false, // Hide map type control
    scaleControl: false, // Hide scale
    streetViewControl: false, // Hide street view
    styles: [
      {
        featureType: 'poi.business',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }], // Hide business POI only
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }], // Hide transit stations
      },
    ],
  };

  constructor(
    private trashbinsService: TrashbinsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getTrashbins();
  }

  // Get trashbins data from server
  getTrashbins(): void {
    this.trashbinsService.getAll().subscribe({
      next: (data) => {
        this.trashbins = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to get data:', err);
      },
    });
  }

  // Apply filters
  applyFilters(): void {
    if (this.activeFilter === 'full') {
      this.filteredTrashbins = this.trashbins.filter((bin) =>
        this.isBinFull(bin)
      );
    } else {
      this.filteredTrashbins = [...this.trashbins];
    }

    // Sort by fill percentage from high to low
    this.filteredTrashbins.sort(
      (a, b) => (b.currentFillPercentage || 0) - (a.currentFillPercentage || 0)
    );
  }

  // Check if bin is full
  isBinFull(bin: Trashbins): boolean {
    return (bin.currentFillPercentage || 0) >= (bin.threshold || 80);
  }

  // Check if trashbin has valid location coordinates
  hasLocation(trashbin: Trashbins): boolean {
    return !!(trashbin.location?.latitude && trashbin.location?.longitude);
  }

  // Get trashbins with location (auto display) - synchronized with table data
  get trashbinsWithLocation(): Trashbins[] {
    // Use the same filtered data as the table to ensure consistency
    return this.filteredTrashbins.filter((bin) => this.hasLocation(bin));
  }

  // Get marker title for tooltip
  getMarkerTitle(trashbin: Trashbins): string {
    return `${trashbin.name}\nFullness: ${
      trashbin.currentFillPercentage || 0
    }%\nAddress: ${trashbin.location?.address || 'No address'}`;
  }

  // Get marker options: red if full, green otherwise
  getMarkerOptions(trashbin: Trashbins) {
    const color = this.isBinFull(trashbin) ? '#F44336' : '#4CAF50';
    const iconUrl =
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="white" stroke="${color}" stroke-width="2"/>
        <path transform="translate(12, 12)" fill="${color}" d="M9 3v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
      </svg>
    `);

    return {
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      },
    };
  }

  // Select trashbin when clicking table row - auto-center and zoom map
  selectTrashbin(trashbin: Trashbins): void {
    this.selectedBinId = trashbin.binId;

    if (this.hasLocation(trashbin)) {
      this.mapCenter = {
        lat: trashbin.location!.latitude!,
        lng: trashbin.location!.longitude!,
      };
      this.mapZoom = 18;
    }
  }

  // Check if trashbin is selected
  isTrashbinSelected(trashbin: Trashbins): boolean {
    return trashbin.binId != null && trashbin.binId === this.selectedBinId;
  }
}
