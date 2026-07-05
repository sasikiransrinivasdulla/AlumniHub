package com.alumnihub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "profile_view_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ProfileViewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewed_user_id", nullable = false)
    private User viewedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewer_user_id", nullable = false)
    private User viewerUser;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt = LocalDateTime.now();
}
