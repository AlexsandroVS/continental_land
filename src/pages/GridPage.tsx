import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroGrid } from "../components/grid/HeroGrid";
import { ProjectSlider } from "../components/grid/ProjectSlider";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FiTrash, FiPlus, FiLogIn, FiLogOut } from "react-icons/fi";
import {
  getSections,
  createSection,
  deleteSection,
  createProject,
  getProjects,
  deleteProject,
  updateProject,
} from "../../api";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  section_id: string;
  category: string;
  image: string;
  description?: string;
}

interface ProjectSection {
  id: string;
  name: string;
  projects: Project[];
}

export default function GridPage() {
  const { user, token, logout } = useAuth();
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    section_id: "",
    category: "",
    image: "",
    description: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const navigate = useNavigate();

  const handleProjectClick = (project: Project) => {
    navigate(`/project/${project.id}`, { state: { project } });
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const [heroData, setHeroData] = useState({
    title: "Innovación en Ingeniería",
    description: "Soluciones tecnológicas que transforman la industria moderna",
    backgroundImage: "/public/assets/images/herogrid.jpg",
  });

  const fetchSections = async () => {
    try {
      const sectionsData = await getSections();
      const projectsData = await getProjects();

      const formattedSections = sectionsData.map((section: any) => ({
        ...section,
        projects: projectsData.filter((p: Project) => p.section_id === section.id),
      }));

      setSections(formattedSections);
    } catch (error) {
      console.error("❌ Error al obtener secciones y proyectos:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta sección?")) return;
    try {
      await deleteSection(sectionId, token);
      fetchSections();
    } catch (error) {
      console.error("❌ Error al eliminar sección:", error);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      alert("El nombre de la sección es obligatorio.");
      return;
    }
    try {
      await createSection(newSectionName, token);
      setNewSectionName("");
      setShowAddSectionModal(false);
      fetchSections();
    } catch (error) {
      console.error("❌ Error al agregar sección:", error);
    }
  };

  const handleLogout = () => {
    logout(); // Llama a la función `logout` del contexto de autenticación
    navigate("/login"); // Redirige al usuario a la página de login
  };
  
  const handleAddProject = async () => {
    if (
      !newProject.title ||
      !selectedImage ||
      !selectedSectionId ||
      !newProject.category ||
      !newProject.description
    ) {
      alert("Completa todos los campos antes de agregar un proyecto.");
      return;
    }

    try {
      await createProject(
        {
          title: newProject.title,
          category: newProject.category,
          description: newProject.description,
          section_id: selectedSectionId,
        },
        selectedImage,
        token
      );

      setShowAddProjectModal(false);
      setNewProject({ title: "", category: "", description: "", image: "" });
      setImagePreview(null);
      setSelectedImage(null);
      setSelectedSectionId(null);
      fetchSections();
    } catch (error) {
      console.error("❌ Error al agregar proyecto:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este proyecto?")) return;

    try {
      const projectExists = sections.some((section) =>
        section.projects.some((p) => p.id === projectId)
      );
      if (!projectExists) {
        alert("El proyecto ya no existe.");
        return;
      }

      await deleteProject(projectId, token);
      fetchSections();
    } catch (error) {
      console.error("❌ Error al eliminar proyecto:", error);
    }
  };

  const handleSaveProject = async () => {
    if (
      !newProject.title ||
      !selectedSectionId ||
      !newProject.category ||
      !newProject.description
    ) {
      alert("Completa todos los campos antes de guardar.");
      return;
    }

    try {
      if (editingProjectId) {
        const projectExists = sections.some((section) =>
          section.projects.some((p) => p.id === editingProjectId)
        );
        if (!projectExists) {
          alert("El proyecto no existe.");
          setEditingProjectId(null);
          return;
        }

        await updateProject(
          editingProjectId,
          {
            title: newProject.title,
            category: newProject.category,
            description: newProject.description,
            section_id: selectedSectionId,
          },
          selectedImage,
          token
        );
      } else {
        await createProject(
          {
            title: newProject.title,
            category: newProject.category,
            description: newProject.description,
            section_id: selectedSectionId,
          },
          selectedImage,
          token
        );
      }

      setShowAddProjectModal(false);
      setNewProject({ title: "", category: "", description: "", image: "" });
      setImagePreview(null);
      setSelectedImage(null);
      setEditingProjectId(null);
      fetchSections();
    } catch (error) {
      console.error("❌ Error al guardar proyecto:", error);
    }
  };

  const handleEditProject = (project: Project) => {
    setNewProject({
      title: project.title,
      category: project.category,
      description: project.description,
      section_id: project.section_id,
      image: project.image,
    });

    setEditingProjectId(project.id);
    setSelectedSectionId(project.section_id);

    const imageUrl = project.image.startsWith("http")
      ? project.image
      : `http://localhost:5000${project.image}`;

    setImagePreview(imageUrl);
    setShowAddProjectModal(true);
  };

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <HeroGrid
        title={heroData.title}
        description={heroData.description}
        backgroundImage={heroData.backgroundImage}
      />

      {/* Botones de filtrado por sección */}
      <section className="flex flex-wrap justify-center gap-4 px-4 mt-6 mb-0">
        <button
          onClick={() => setSelectedSectionId(null)}
          className={`px-6 py-4 rounded-lg text-lg ${
            selectedSectionId === null
              ? "bg-[var(--color-primario)] text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Todas las secciones
        </button>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedSectionId(section.id)}
            className={`px-4 py-2 rounded-lg ${
              selectedSectionId === section.id
                ? "bg-[var(--color-primario)] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {section.name}
          </button>
        ))}
      </section>

      {/* Renderizar Secciones */}
      <AnimatePresence>
        {sections
          .filter((section) => !selectedSectionId || section.id === selectedSectionId)
          .map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="relative p-6 border-b border-gray-300"
            >
              {user?.role === "admin" && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-700 transition"
                  >
                    <FiTrash className="text-xl" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setNewProject({
                        title: "",
                        section_id: section.id,
                        category: section.name,
                        image: "",
                        description: "",
                      });
                      setShowAddProjectModal(true);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 transition"
                  >
                    <FiPlus className="text-xl" />
                  </button>
                </div>
              )}

              <ProjectSlider
                title={section.name}
                projects={section.projects}
                onDeleteProject={handleDeleteProject}
                onEditProject={handleEditProject}
                onProjectClick={handleProjectClick}
                isAdmin={user?.role === "admin"}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Botón Agregar Sección */}
      {user?.role === "admin" && (
        <button
          onClick={() => setShowAddSectionModal(true)}
          className="mt-8 px-6 py-3 flex ml-4 bg-[var(--color-primario)] text-white rounded-full hover:bg-[#5a2fc2] transition"
        >
          <FiPlus className="mr-2" /> Agregar Sección
        </button>
      )}

      {/* Botón flotante para iniciar sesión */}
      <button
        onClick={user ? handleLogout : () => navigate("/login")} // 🔹 Cambia el comportamiento según si el usuario está autenticado
        className="fixed bottom-4 right-4 p-4 bg-[var(--color-primario)] text-white rounded-full shadow-lg hover:bg-[#5a2fc2] transition"
      >
        {user ? <FiLogOut className="text-2xl" /> : <FiLogIn className="text-2xl" />}
      </button>

      {/* Modales para agregar/editar proyectos y secciones */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-8 max-w-md h-[90vh] overflow-y-auto w-full space-y-6 relative"
          >
            <button
              onClick={() => {
                setShowAddProjectModal(false);
                setEditingProjectId(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900">
              {editingProjectId ? "Editar Proyecto" : "Agregar Nuevo Proyecto"}
            </h3>

            <p className="text-gray-600 mb-4">
              <strong>Sección:</strong>{" "}
              {sections.find((s) => s.id === selectedSectionId)?.name || "N/A"}
            </p>

            <input
              placeholder="Título"
              className="w-full p-3 border focus:outline-0 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent text-lg"
              value={newProject.title ?? ""}
              onChange={(e) =>
                setNewProject({ ...newProject, title: e.target.value })
              }
            />

            <input
              placeholder="Categoría"
              className="w-full p-3 border focus:outline-0 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent text-lg"
              value={newProject.category ?? ""}
              onChange={(e) =>
                setNewProject({ ...newProject, category: e.target.value })
              }
            />

            <div className="flex flex-col items-center">
              <label className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors text-center">
                <span className="text-gray-600">Subir imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden "
                />
              </label>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="mt-4 w-48 h-48 object-cover rounded-lg shadow-md"
                />
              )}
            </div>

            <textarea
              placeholder="Descripción"
              className="w-full p-3 border focus:outline-0 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent text-lg"
              rows={4}
              value={newProject.description ?? ""}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddProjectModal(false);
                  setEditingProjectId(null);
                }}
                className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProject}
                className="px-5 py-2 bg-[var(--color-primario)] text-white rounded-lg hover:bg-[#5a2fc2] transition-colors text-lg"
              >
                {editingProjectId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-8 max-w-md w-full space-y-6 relative"
          >
            <button
              onClick={() => setShowAddSectionModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900">
              Agregar Sección
            </h3>

            <input
              placeholder="Nombre de la sección"
              className="w-full p-3 border focus:outline-0 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent text-lg"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSection}
                className="px-5 py-2 bg-[var(--color-primario)] text-white rounded-lg hover:bg-[#5a2fc2] transition-colors text-lg"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}