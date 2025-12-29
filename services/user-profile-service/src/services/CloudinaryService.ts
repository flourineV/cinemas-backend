import { cloudinary } from "../config/Cloudinary";
export class CloudinaryService {
  /**
   * Lấy public URL từ publicId
   */
  getPublicUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }

  /**
   * Xóa file theo publicId (ví dụ: avatars/user123 hoặc chỉ user123)
   */
  async deleteFile(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    console.log("Deleting:", publicId, "Result:", result);
  }

  /**
   * Helper: Extract publicId từ secure_url
   * Ví dụ:
   *  - https://res.cloudinary.com/<cloud>/image/upload/v123456789/avatars/abc123.jpg
   *    => publicId = "avatars/abc123"
   *  - https://res.cloudinary.com/<cloud>/image/upload/v123456789/616059_esdwkd.jpg
   *    => publicId = "616059_esdwkd"
   */
  private extractPublicId(fileUrl: string): string {
    const parts = fileUrl.split("/");
    const fileNameWithExt = parts[parts.length - 1]; // 616059_esdwkd.jpg
    const fileName = fileNameWithExt.split(".")[0]; // 616059_esdwkd

    // Lấy phần sau "upload/"
    const uploadIndex = parts.findIndex((p) => p === "upload");
    const pathAfterUpload = parts.slice(uploadIndex + 1, parts.length - 1);

    // Bỏ qua phần version (bắt đầu bằng "v" + số)
    const filteredPath = pathAfterUpload.filter((p) => !/^v\d+$/.test(p));

    if (filteredPath.length > 0) {
      return `${filteredPath.join("/")}/${fileName}`;
    }
    return fileName;
  }

  /**
   * Xóa file từ secure_url mà FE gửi về
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    if (fileUrl && !fileUrl.includes("default_avt.jpg")) {
      const publicId = this.extractPublicId(fileUrl);
      await this.deleteFile(publicId);
    }
  }
}
