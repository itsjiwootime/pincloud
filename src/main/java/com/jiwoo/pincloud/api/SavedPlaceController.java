package com.jiwoo.pincloud.api;

import com.jiwoo.pincloud.common.ApiResponse;
import com.jiwoo.pincloud.domain.place.SavedPlaceCreateRequest;
import com.jiwoo.pincloud.domain.place.SavedPlaceResponse;
import com.jiwoo.pincloud.domain.place.SavedPlaceService;
import com.jiwoo.pincloud.domain.place.SavedPlaceUpdateRequest;
import com.jiwoo.pincloud.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/saved-places")
@RequiredArgsConstructor
public class SavedPlaceController {

    private final SavedPlaceService savedPlaceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedPlaceResponse>>> findAll(
            @RequestParam(name = "bbox", required = false) String bbox
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        Double[] coordinates = bbox == null || bbox.isBlank() ? null : parseBbox(bbox);
        List<SavedPlaceResponse> response = bbox == null || bbox.isBlank()
                ? savedPlaceService.findAll(userId)
                : savedPlaceService.findByBbox(userId, coordinates[0], coordinates[2], coordinates[1], coordinates[3]);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedPlaceResponse>> create(
            @Valid @RequestBody SavedPlaceCreateRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        SavedPlaceResponse response = savedPlaceService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("saved place created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SavedPlaceResponse>> findById(@PathVariable("id") Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(savedPlaceService.findById(id, userId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SavedPlaceResponse>> update(
            @PathVariable("id") Long id,
            @RequestBody SavedPlaceUpdateRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        SavedPlaceResponse response = savedPlaceService.update(id, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("saved place updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        savedPlaceService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Double[] parseBbox(String bbox) {
        String[] tokens = bbox.split(",");
        if (tokens.length != 4) {
            throw new IllegalArgumentException("bbox must be minLat,minLng,maxLat,maxLng");
        }

        try {
            return new Double[]{
                    Double.parseDouble(tokens[0].trim()),
                    Double.parseDouble(tokens[1].trim()),
                    Double.parseDouble(tokens[2].trim()),
                    Double.parseDouble(tokens[3].trim())
            };
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("bbox must contain valid numbers");
        }
    }
}
