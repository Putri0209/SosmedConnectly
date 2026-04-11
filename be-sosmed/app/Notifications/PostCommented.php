<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PostCommented extends Notification
{
    use Queueable;

    protected $commenter;
    protected $post;

    /**
     * Create a new notification instance.
     */
    public function __construct($commenter, $post)
    {
        $this->commenter = $commenter;
        $this->post = $post;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'comment',
            'post_id' => $this->post->id,
            'actor_id' => $this->commenter->id,
            'actor_name' => $this->commenter->name,
            'actor_username' => $this->commenter->username,
            'message' => 'mengomentari postingan Anda.',
        ];
    }
}
